import { afterEach, describe, expect, test } from "bun:test"
import { createHash, randomUUID } from "node:crypto"
import { mkdir, mkdtemp, readdir, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { E2eCheckpoint } from "./config/e2eCheckpointSchema.ts"
import { e2eCheckpointWrite } from "./config/e2eCheckpointWrite.ts"
import { e2eRunnerRun } from "./e2eRunnerRun.ts"
import { e2eSuitePathsGet } from "./e2eSuitePathsGet.ts"

const roots: string[] = []
const lifetime = 24 * 60 * 60 * 1000
const now = 1_800_000_000_000

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

async function testRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "solid-convex-e2e-runner-test-"))
  roots.push(root)
  return root
}

function checkpointPath(root: string, target: "production" | "dev", baseUrl: string): string {
  const hash = createHash("sha256").update(`${target}\n${baseUrl}`).digest("hex")
  return join(root, `${target}-${hash}.json`)
}

function checkpointCreate(overrides: Partial<E2eCheckpoint> = {}): E2eCheckpoint {
  return {
    version: 1,
    environment: "production",
    baseUrl: "http://localhost:3012",
    runId: randomUUID(),
    createdAt: now,
    completedSuiteIds: [],
    ownedResources: [],
    ...overrides,
  }
}

describe("e2eRunnerRun", () => {
  test("discovers workflow files in sorted order and executes a fresh run sequentially", async () => {
    const root = await testRoot()
    const workflows = join(root, "e2e/workflows")
    await mkdir(join(workflows, "nested"), { recursive: true })
    await Bun.write(join(workflows, "second.test.ts"), "")
    await Bun.write(join(workflows, "nested/first.test.ts"), "")
    await Bun.write(join(root, "e2e/other.test.ts"), "")

    const suitePaths = e2eSuitePathsGet(root)
    expect(suitePaths).toEqual(["e2e/workflows/nested/first.test.ts", "e2e/workflows/second.test.ts"])
    const started: string[] = []
    let running = false
    await e2eRunnerRun({
      target: "production",
      baseUrl: "http://localhost:3012",
      checkpointDirectory: join(root, "checkpoints"),
      suitePaths,
      now: () => now,
      runSuite: async (path) => {
        expect(running).toBe(false)
        running = true
        started.push(path)
        await Promise.resolve()
        running = false
      },
    })

    expect(started).toEqual(suitePaths)
    expect(await readdir(join(root, "checkpoints"))).toEqual([])
  })

  test("rejects empty or duplicate suite identities before execution", async () => {
    const root = await testRoot()
    const runSuite = async () => {
      throw new Error("suite should not execute")
    }
    for (const suitePaths of [
      ["", "workflow.test.ts"],
      ["workflow.test.ts", "workflow.test.ts"],
    ]) {
      await expect(
        e2eRunnerRun({
          target: "production",
          baseUrl: "http://localhost:3012",
          checkpointDirectory: join(root, "checkpoints"),
          suitePaths,
          now: () => now,
          runSuite,
        }),
      ).rejects.toThrow(suitePaths[0] ? "distinct" : "nonempty")
    }
    expect(await Bun.file(join(root, "checkpoints")).exists()).toBe(false)
  })

  test("preserves resources registered by a suite when marking it complete", async () => {
    const root = await testRoot()
    const checkpointDirectory = join(root, "checkpoints")
    const suitePath = "e2e/workflows/registers-resource.test.ts"
    let cleanedResourceId = ""
    await e2eRunnerRun({
      target: "production",
      baseUrl: "http://localhost:3012",
      checkpointDirectory,
      suitePaths: [suitePath],
      now: () => now,
      runSuite: async (_path, context) => {
        const childCheckpoint = checkpointCreate({ runId: context.runId })
        childCheckpoint.ownedResources.push({
          resourceType: "fake",
          resourceId: `e2e-${context.runId}-registered`,
          ownerRunId: context.runId,
          createdAt: now,
        })
        await e2eCheckpointWrite(context.checkpointPath, childCheckpoint)
      },
      cleanupResource: async (resource) => {
        cleanedResourceId = resource.resourceId
      },
    })

    expect(cleanedResourceId).toContain("-registered")
    expect(await readdir(checkpointDirectory)).toEqual([])
  })

  test("retains completed steps after failure and resumes only unfinished suites", async () => {
    const root = await testRoot()
    const checkpointDirectory = join(root, "checkpoints")
    const suitePaths = ["e2e/workflows/a.test.ts", "e2e/workflows/b.test.ts", "e2e/workflows/c.test.ts"]
    const firstAttempt: string[] = []
    await expect(
      e2eRunnerRun({
        target: "production",
        baseUrl: "http://localhost:3012",
        checkpointDirectory,
        suitePaths,
        now: () => now,
        runSuite: async (path) => {
          firstAttempt.push(path)
          if (path.endsWith("b.test.ts")) throw new Error("suite failed")
        },
      }),
    ).rejects.toThrow("suite failed")

    const path = checkpointPath(checkpointDirectory, "production", "http://localhost:3012")
    const saved = JSON.parse(await readFile(path, "utf8")) as E2eCheckpoint
    expect(saved.completedSuiteIds).toEqual([suitePaths[0]])
    const resumed: string[] = []
    await e2eRunnerRun({
      target: "production",
      baseUrl: "http://localhost:3012",
      checkpointDirectory,
      suitePaths: [...suitePaths, "e2e/workflows/new.test.ts"],
      now: () => now + 1,
      runSuite: async (suite) => {
        resumed.push(suite)
      },
    })
    expect(firstAttempt).toEqual(suitePaths.slice(0, 2))
    expect(resumed).toEqual([...suitePaths.slice(1), "e2e/workflows/new.test.ts"])
    expect(await readdir(checkpointDirectory)).toEqual([])
  })

  test("isolates checkpoints by target and base URL", async () => {
    const root = await testRoot()
    const checkpointDirectory = join(root, "checkpoints")
    const runSuite = async () => {
      throw new Error("stop and retain checkpoint")
    }
    for (const [target, baseUrl] of [
      ["production", "http://localhost:3012"],
      ["dev", "http://localhost:3012"],
      ["production", "https://example.test"],
    ] as const) {
      await expect(
        e2eRunnerRun({
          target,
          baseUrl,
          checkpointDirectory,
          suitePaths: ["workflow.test.ts"],
          now: () => now,
          runSuite,
        }),
      ).rejects.toThrow()
    }
    const files = await readdir(checkpointDirectory)
    expect(new Set(files).size).toBe(3)
  })

  test("cleans expired runs using only registered owned-resource cleanup", async () => {
    const root = await testRoot()
    const checkpointDirectory = join(root, "checkpoints")
    const stale = checkpointCreate({
      environment: "dev",
      baseUrl: "http://localhost:3012",
      createdAt: now - lifetime,
      ownedResources: [
        { resourceType: "fake", resourceId: "placeholder", ownerRunId: "placeholder", createdAt: now - lifetime },
      ],
    })
    stale.ownedResources = [
      {
        resourceType: "fake",
        resourceId: `e2e-${stale.runId}-resource`,
        ownerRunId: stale.runId,
        createdAt: stale.createdAt,
      },
    ]
    await e2eCheckpointWrite(checkpointPath(checkpointDirectory, "dev", stale.baseUrl), stale)
    const cleaned: string[] = []
    await e2eRunnerRun({
      target: "production",
      baseUrl: "http://localhost:3012",
      checkpointDirectory,
      suitePaths: ["workflow.test.ts"],
      now: () => now,
      runSuite: async () => {},
      cleanupResource: async (resource, owner) => {
        expect(resource.ownerRunId).toBe(owner.runId)
        cleaned.push(resource.resourceId)
      },
    })
    expect(cleaned).toEqual(stale.ownedResources.map(({ resourceId }) => resourceId))
    expect(await readdir(checkpointDirectory)).toEqual([])
  })

  test("rejects invalid checkpoint ownership and does not invoke cleanup", async () => {
    const root = await testRoot()
    const checkpointDirectory = join(root, "checkpoints")
    const invalid = checkpointCreate({
      ownedResources: [
        { resourceType: "fake", resourceId: "e2e-not-this-run-resource", ownerRunId: "other-run", createdAt: now },
      ],
    })
    const path = checkpointPath(checkpointDirectory, "production", invalid.baseUrl)
    await mkdir(checkpointDirectory, { recursive: true })
    await Bun.write(path, JSON.stringify(invalid))
    let cleanupCalled = false
    await expect(
      e2eRunnerRun({
        target: "production",
        baseUrl: invalid.baseUrl,
        checkpointDirectory,
        suitePaths: ["workflow.test.ts"],
        now: () => now,
        runSuite: async () => {},
        cleanupResource: async () => {
          cleanupCalled = true
        },
      }),
    ).rejects.toThrow()
    expect(cleanupCalled).toBe(false)
    expect(await Bun.file(path).exists()).toBe(true)
  })

  test("runs cleanup in finally after failure and clears checkpoint only after verified success", async () => {
    const root = await testRoot()
    const checkpointDirectory = join(root, "checkpoints")
    const suitePaths = ["e2e/workflows/failure.test.ts"]
    let checkpoint = checkpointCreate()
    let cleanupObservedCheckpoint = false
    await expect(
      e2eRunnerRun({
        target: "production",
        baseUrl: checkpoint.baseUrl,
        checkpointDirectory,
        suitePaths,
        now: () => now,
        runSuite: async (_suite, context) => {
          checkpoint = { ...checkpoint, runId: context.runId }
          checkpoint.ownedResources = [
            {
              resourceType: "fake",
              resourceId: `e2e-${context.runId}-resource`,
              ownerRunId: context.runId,
              createdAt: now,
            },
          ]
          await e2eCheckpointWrite(context.checkpointPath, checkpoint)
          throw new Error("failed with owned resource")
        },
        cleanupResource: async () => {
          cleanupObservedCheckpoint = true
        },
      }),
    ).rejects.toThrow("failed with owned resource")
    expect(cleanupObservedCheckpoint).toBe(false)
    expect(await readdir(checkpointDirectory)).toHaveLength(1)

    let verifiedRemoval = false
    await e2eRunnerRun({
      target: "production",
      baseUrl: checkpoint.baseUrl,
      checkpointDirectory,
      suitePaths,
      now: () => now + 1,
      runSuite: async () => {},
      cleanupResource: async (resource) => {
        expect(resource.resourceId).toContain("-resource")
        verifiedRemoval = true
      },
    })
    expect(verifiedRemoval).toBe(true)
    expect(await readdir(checkpointDirectory)).toEqual([])
  })

  test("preserves checkpoints when resource cleanup cannot verify removal", async () => {
    const root = await testRoot()
    const checkpointDirectory = join(root, "checkpoints")
    const checkpoint = checkpointCreate({
      ownedResources: [{ resourceType: "fake", resourceId: "pending", ownerRunId: "pending", createdAt: now }],
    })
    checkpoint.ownedResources = [
      {
        resourceType: "fake",
        resourceId: `e2e-${checkpoint.runId}-resource`,
        ownerRunId: checkpoint.runId,
        createdAt: now,
      },
    ]
    await e2eCheckpointWrite(checkpointPath(checkpointDirectory, "production", checkpoint.baseUrl), checkpoint)
    await expect(
      e2eRunnerRun({
        target: "production",
        baseUrl: checkpoint.baseUrl,
        checkpointDirectory,
        suitePaths: ["already-completed.test.ts"],
        now: () => now,
        runSuite: async () => {},
        cleanupResource: async () => {
          throw new Error("resource still exists")
        },
      }),
    ).rejects.toThrow()
    expect(await readdir(checkpointDirectory)).toHaveLength(1)
  })
})
