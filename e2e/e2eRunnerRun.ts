import { createHash, randomUUID } from "node:crypto"
import { spawn } from "node:child_process"
import { mkdir, readdir, readFile, rm } from "node:fs/promises"
import { join, resolve } from "node:path"
import * as v from "valibot"
import { type E2eCheckpoint, e2eCheckpointSchema } from "./config/e2eCheckpointSchema.ts"
import type { E2eOwnedResource } from "./config/e2eOwnedResourceSchema.ts"
import { e2eCheckpointWrite } from "./config/e2eCheckpointWrite.ts"
import { e2eSuitePathsGet } from "./e2eSuitePathsGet.ts"

const checkpointLifetimeMs = 24 * 60 * 60 * 1000

type E2eRunnerOptions = {
  target: "production" | "dev"
  baseUrl: string
  checkpointDirectory: string
  suitePaths?: string[]
  now?: () => number
  runSuite?: (
    suitePath: string,
    context: { baseUrl: string; target: "production" | "dev"; checkpointPath: string; runId: string },
  ) => Promise<void>
  cleanupResource?: (resource: E2eOwnedResource, checkpoint: E2eCheckpoint) => Promise<void>
  cleanupStale?: () => Promise<void>
}

async function e2eCheckpointRead(
  path: string,
  checkpointDirectory: string,
  now: number,
): Promise<E2eCheckpoint | undefined> {
  let text: string
  try {
    text = await readFile(path, "utf8")
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined
    throw error
  }
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch (error) {
    throw new Error(`Invalid E2E checkpoint JSON at ${path}`, { cause: error })
  }
  const parsed = v.safeParse(e2eCheckpointSchema, raw)
  if (!parsed.success) throw new Error(`Invalid E2E checkpoint at ${path}: ${v.summarize(parsed.issues)}`)
  const checkpoint = parsed.output
  if (!Number.isFinite(checkpoint.createdAt) || checkpoint.createdAt <= 0 || checkpoint.createdAt > now)
    throw new Error(`Invalid E2E checkpoint creation time at ${path}`)
  if (!/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/iu.test(checkpoint.runId))
    throw new Error(`Invalid E2E checkpoint run ID at ${path}`)
  const completed = new Set(checkpoint.completedSuiteIds)
  if (completed.size !== checkpoint.completedSuiteIds.length || checkpoint.completedSuiteIds.some((id) => !id.trim()))
    throw new Error(`Invalid completed suite identities at ${path}`)
  for (const resource of checkpoint.ownedResources) {
    if (
      resource.ownerRunId !== checkpoint.runId ||
      !resource.resourceType.trim() ||
      !resource.resourceId.startsWith(`e2e-${checkpoint.runId}-`) ||
      !Number.isFinite(resource.createdAt) ||
      resource.createdAt < checkpoint.createdAt ||
      resource.createdAt > now
    )
      throw new Error(`Invalid owned resource identity or creation time at ${path}`)
    if (resource.resourceType === "auth-session" && (
      !resource.sessionProof ||
      resource.resourceId !== `e2e-${checkpoint.runId}-session-${resource.sessionProof.sessionId}` ||
      resource.createdAt !== resource.sessionProof.creationTime ||
      Date.parse(resource.sessionProof.createdAt) < checkpoint.createdAt ||
      Date.parse(resource.sessionProof.createdAt) > now
    )) throw new Error(`Invalid owned session proof at ${path}`)
    if (resource.resourceType !== "auth-session" && resource.sessionProof)
      throw new Error(`Unexpected session proof at ${path}`)
  }
  let canonicalBaseUrl: string
  try {
    const url = new URL(checkpoint.baseUrl)
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error()
    canonicalBaseUrl = url.toString().replace(/\/$/u, "")
  } catch {
    throw new Error(`Invalid E2E checkpoint base URL at ${path}`)
  }
  if (canonicalBaseUrl !== checkpoint.baseUrl) throw new Error(`Non-canonical E2E checkpoint base URL at ${path}`)
  const expectedPath = join(
    checkpointDirectory,
    `${checkpoint.environment}-${createHash("sha256").update(`${checkpoint.environment}\n${checkpoint.baseUrl}`).digest("hex")}.json`,
  )
  if (resolve(path) !== resolve(expectedPath))
    throw new Error(`E2E checkpoint identity does not match its path: ${path}`)
  return checkpoint
}

async function e2eCheckpointCleanup(
  checkpoint: E2eCheckpoint,
  cleanupResource: E2eRunnerOptions["cleanupResource"],
): Promise<void> {
  for (const resource of checkpoint.ownedResources) {
    if (resource.ownerRunId !== checkpoint.runId || !resource.resourceId.startsWith(`e2e-${checkpoint.runId}-`))
      throw new Error(`Refusing cleanup of unverified resource ownership in run ${checkpoint.runId}`)
    if (!cleanupResource)
      throw new Error(`No verified E2E cleanup adapter is registered for resource type: ${resource.resourceType}`)
    await cleanupResource(resource, checkpoint)
  }
}

async function e2eCheckpointRemove(
  path: string,
  checkpoint: E2eCheckpoint,
  cleanupResource: E2eRunnerOptions["cleanupResource"],
): Promise<void> {
  await e2eCheckpointCleanup(checkpoint, cleanupResource)
  await rm(path)
}

async function e2eCheckpointSweepExpired(
  checkpointDirectory: string,
  now: () => number,
  cleanupResource: E2eRunnerOptions["cleanupResource"],
): Promise<void> {
  const errors: unknown[] = []
  let entries: import("node:fs").Dirent[]
  try {
    entries = await readdir(checkpointDirectory, { withFileTypes: true })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return
    throw error
  }
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue
    const path = join(checkpointDirectory, entry.name)
    try {
      const checkpoint = await e2eCheckpointRead(path, checkpointDirectory, now())
      if (checkpoint && now() - checkpoint.createdAt > checkpointLifetimeMs)
        await e2eCheckpointRemove(path, checkpoint, cleanupResource)
    } catch (error) {
      errors.push(error)
    }
  }
  if (errors.length) throw new AggregateError(errors, "One or more expired E2E checkpoints could not be swept")
}

async function e2eRunnerRunLocked(options: E2eRunnerOptions): Promise<void> {
  const now = options.now ?? Date.now
  const suitePaths = (options.suitePaths ?? e2eSuitePathsGet()).map((path) => path.replaceAll("\\", "/"))
  const suiteIds = suitePaths
  if (suiteIds.some((suiteId) => !suiteId.trim())) throw new Error("E2E suite identities must be nonempty")
  if (new Set(suiteIds).size !== suiteIds.length) throw new Error("E2E suite identities must be distinct")
  const target = options.target
  const baseUrl = new URL(options.baseUrl).toString().replace(/\/$/u, "")
  const targetHash = createHash("sha256").update(`${target}\n${baseUrl}`).digest("hex")
  const checkpointPath = join(options.checkpointDirectory, `${target}-${targetHash}.json`)
  let checkpoint: E2eCheckpoint | undefined
  let succeeded = false
  const errors: unknown[] = []
  try {
    if (suitePaths.length === 0) throw new Error("No E2E workflow suites were discovered")
    checkpoint = await e2eCheckpointRead(checkpointPath, options.checkpointDirectory, now())
    if (checkpoint && (checkpoint.environment !== target || checkpoint.baseUrl !== baseUrl))
      throw new Error("E2E checkpoint target does not match the requested target")
    if (checkpoint && now() - checkpoint.createdAt > checkpointLifetimeMs) {
      await e2eCheckpointRemove(checkpointPath, checkpoint, options.cleanupResource)
      checkpoint = undefined
    }
    checkpoint ??= {
      version: 1,
      environment: target,
      baseUrl,
      runId: randomUUID(),
      createdAt: now(),
      completedSuiteIds: [],
      ownedResources: [],
    }
    await e2eCheckpointWrite(checkpointPath, checkpoint)
    for (const [index, suitePath] of suitePaths.entries()) {
      const suiteId = suiteIds[index]
      if (!suiteId) throw new Error(`Missing E2E suite identity for ${suitePath}`)
      if (checkpoint.completedSuiteIds.includes(suiteId)) continue
      if (!options.runSuite) throw new Error("No E2E suite executor is configured")
      await options.runSuite(suitePath, { baseUrl, target, checkpointPath, runId: checkpoint.runId })
      const updatedCheckpoint = await e2eCheckpointRead(checkpointPath, options.checkpointDirectory, now())
      if (!updatedCheckpoint) throw new Error(`E2E checkpoint disappeared during suite execution: ${suiteId}`)
      if (
        updatedCheckpoint.runId !== checkpoint.runId ||
        updatedCheckpoint.createdAt !== checkpoint.createdAt ||
        updatedCheckpoint.environment !== target ||
        updatedCheckpoint.baseUrl !== baseUrl
      )
        throw new Error(`E2E checkpoint identity changed during suite execution: ${suiteId}`)
      checkpoint = { ...updatedCheckpoint, completedSuiteIds: [...updatedCheckpoint.completedSuiteIds, suiteId] }
      await e2eCheckpointWrite(checkpointPath, checkpoint)
    }
    succeeded = true
  } catch (error) {
    errors.push(error)
  }
  try {
    await e2eCheckpointSweepExpired(options.checkpointDirectory, now, options.cleanupResource)
  } catch (error) {
    errors.push(error)
  }
  try {
    await options.cleanupStale?.()
  } catch (error) {
    errors.push(error)
  }
  if (succeeded && checkpoint && errors.length === 0) {
    try {
      await e2eCheckpointRemove(checkpointPath, checkpoint, options.cleanupResource)
    } catch (error) {
      errors.push(error)
    }
  }
  if (errors.length === 1) throw errors[0]
  if (errors.length > 1) throw new AggregateError(errors, "E2E execution and cleanup failed")
}

export async function e2eRunnerRun(options: E2eRunnerOptions): Promise<void> {
  const suitePaths = options.suitePaths ?? e2eSuitePathsGet()
  if (suitePaths.some((path) => !path.trim())) throw new Error("E2E suite identities must be nonempty")
  if (new Set(suitePaths.map((path) => path.replaceAll("\\", "/"))).size !== suitePaths.length)
    throw new Error("E2E suite identities must be distinct")
  await mkdir(options.checkpointDirectory, { recursive: true, mode: 0o700 })
  const lockPath = `${options.checkpointDirectory}.lock`
  const lock = spawn("flock", ["-n", lockPath, "sh", "-c", "printf locked; cat >/dev/null"], {
    stdio: ["pipe", "pipe", "ignore"],
  })
  await new Promise<void>((resolve, reject) => {
    lock.once("error", reject)
    lock.once("exit", () => reject(new Error(`Unable to acquire E2E invocation lock: ${lockPath}`)))
    lock.stdout.once("data", () => resolve())
  })
  try {
    await e2eRunnerRunLocked(options)
  } finally {
    lock.stdin.end()
    await new Promise<void>((resolve) => {
      if (lock.exitCode !== null) return resolve()
      lock.once("exit", () => resolve())
    })
  }
}
