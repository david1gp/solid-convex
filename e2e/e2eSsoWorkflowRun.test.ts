import { afterEach, expect, test } from "bun:test"
import { createHash } from "node:crypto"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import * as v from "valibot"
import { createResult, createResultError } from "#result"
import { type E2eCheckpoint, e2eCheckpointSchema } from "./config/e2eCheckpointSchema.ts"
import { e2eCheckpointWrite } from "./config/e2eCheckpointWrite.ts"
import { e2eRunnerRun } from "./e2eRunnerRun.ts"
import { e2eSsoCheckpointStoreCreate } from "./workflows/ssoSignIn/e2eSsoCheckpointStoreCreate.ts"
import { e2eSsoSessionOwnershipProve } from "./workflows/ssoSignIn/e2eSsoSessionOwnershipProve.ts"
import { type E2eSsoSessionProof } from "./workflows/ssoSignIn/e2eSsoSessionProofSchema.ts"
import { e2eSsoSessionTransportCreate } from "./workflows/ssoSignIn/e2eSsoSessionTransportCreate.ts"
import { e2eSsoStepIds } from "./workflows/ssoSignIn/e2eSsoStepIds.ts"
import { e2eSsoWorkflowRun } from "./workflows/ssoSignIn/e2eSsoWorkflowRun.ts"

const roots: string[] = []
const start = 1_800_000_000_000
const backendUrl = "https://convex.example.test"
const accountKey = "a".repeat(64)
const digest = (token: string) => createHash("sha256").update(token).digest("hex")

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

function session(id: string, creationTime = start + 20): E2eSsoSessionProof {
  return {
    sessionId: id,
    userId: "shared-user",
    createdAt: new Date(creationTime).toISOString(),
    creationTime,
    tokenDigest: digest(`token-${id}`),
    e2eRunId: "test-run",
    ownedAt: start,
  }
}

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "solid-convex-sso-resume-test-"))
  roots.push(root)
  const checkpointPath = join(root, "checkpoint.json")
  const checkpoint: E2eCheckpoint = {
    version: 1,
    runId: "test-run",
    createdAt: start,
    environment: "production",
    baseUrl: "https://app.example.test",
    completedSuiteIds: [],
    ownedResources: [],
  }
  await e2eCheckpointWrite(checkpointPath, checkpoint)
  const store = () =>
    e2eSsoCheckpointStoreCreate({
      checkpointPath,
      runId: checkpoint.runId,
      target: "production",
      baseUrl: checkpoint.baseUrl,
    })
  const load = async () => JSON.parse(await readFile(checkpointPath, "utf8")) as E2eCheckpoint
  return { checkpointPath, checkpoint, store, load }
}

function invocation(input: {
  store: ReturnType<typeof e2eSsoCheckpointStoreCreate>
  proof: E2eSsoSessionProof
  baseline?: E2eSsoSessionProof[]
  failAt?: (typeof e2eSsoStepIds)[number]
  startedAt?: number
  mark?: Parameters<typeof e2eSsoWorkflowRun>[0]["sessionMark"]
}) {
  const steps: string[] = []
  let reads = 0
  let ticks = 0
  return {
    steps,
    run: () =>
      e2eSsoWorkflowRun({
        store: input.store,
        backendUrl,
        accountKey,
        now: () => (input.startedAt ?? start + 10) + ticks++ * 100,
        sessionsRead: async () =>
          createResult(reads++ === 0 ? (input.baseline ?? []) : [...(input.baseline ?? []), input.proof]),
        sessionMark:
          input.mark ??
          (async (ownership) => {
            expect(ownership).toEqual({
              token: `token-${input.proof.sessionId}`,
              userId: input.proof.userId,
              e2eRunId: input.proof.e2eRunId,
              ownedAt: start,
            })
            return createResult(input.proof)
          }),
        browserSessionRead: async () =>
          createResult({
            userId: input.proof.userId,
            token: `token-${input.proof.sessionId}`,
            tokenDigest: input.proof.tokenDigest,
          }),
        steps: Object.fromEntries(
          e2eSsoStepIds.map((id) => [
            id,
            async () => {
              steps.push(id)
              // Mutation intent must already be durable when any browser action begins.
              const before = await input.store.load()
              expect(before.success && before.data.ssoSignIn?.attempts.length).toBeGreaterThan(0)
              return id === input.failAt ? createResultError(id, "controlled failure") : createResult(undefined)
            },
          ]),
        ) as Parameters<typeof e2eSsoWorkflowRun>[0]["steps"],
      }),
  }
}

test("SSO resumes logical steps without losing progress while reestablishing fresh-browser preconditions", async () => {
  const f = await fixture()
  const original = session("first")
  const first = invocation({ store: f.store(), proof: original, failAt: "overview-verify" })
  expect((await first.run()).success).toBe(false)
  const failed = await f.load()
  expect(failed.ssoSignIn?.completedStepIds).toEqual(e2eSsoStepIds.slice(0, 3))
  expect(failed.ownedResources[0]?.sessionProof).toEqual(original)
  expect(failed.ownedResources[0]?.createdAt).toBe(original.creationTime)

  const second = invocation({
    store: f.store(),
    proof: session("unused", start + 2020),
    baseline: [original],
    startedAt: start + 2000,
    failAt: "username-submit",
  })
  expect((await second.run()).success).toBe(false)
  expect(second.steps).toEqual(e2eSsoStepIds.slice(0, 2))
  expect((await f.load()).ssoSignIn?.completedStepIds).toEqual(e2eSsoStepIds.slice(0, 3))

  const replacement = session("second", start + 4020)
  const third = invocation({ store: f.store(), proof: replacement, baseline: [original], startedAt: start + 4000 })
  expect(await third.run()).toEqual(createResult(undefined))
  expect(third.steps).toEqual([...e2eSsoStepIds])
  const resumed = await f.load()
  expect(resumed.createdAt).toBe(start)
  expect(resumed.ssoSignIn?.completedStepIds).toEqual([...e2eSsoStepIds])
  expect(resumed.ssoSignIn?.attempts).toHaveLength(3)
  expect(resumed.ownedResources.map((resource) => resource.sessionProof)).toEqual([original, replacement])
  expect(resumed.ownedResources.map((resource) => resource.createdAt)).toEqual([
    original.creationTime,
    replacement.creationTime,
  ])
  const text = await readFile(f.checkpointPath, "utf8")
  expect(text).not.toContain("token-first")
  expect(text).not.toContain("token-second")
  expect(text).not.toContain('"password"')
  expect(text).not.toContain('"token"')
  expect(text).not.toContain('"cookies"')
})

test("SSO checkpoints only verified ordered effects at each possible interrupted step", async () => {
  for (const [index, failAt] of e2eSsoStepIds.entries()) {
    const f = await fixture()
    const run = invocation({ store: f.store(), proof: session(`failure-${index}`), failAt })
    expect((await run.run()).success).toBe(false)
    expect((await f.load()).ssoSignIn?.completedStepIds).toEqual(e2eSsoStepIds.slice(0, index))
    expect((await f.load()).ownedResources).toHaveLength(index > 2 ? 1 : 0)
  }
})

test("SSO does not register local ownership if the backend mark fails or returns another exact session", async () => {
  const proof = session("unregistered")
  for (const mark of [
    async () => createResultError("authSessionE2eMarkMutation", "mark rejected"),
    async () => createResult({ ...proof, sessionId: "different-session" }),
    async () => createResult({ ...proof, creationTime: proof.creationTime + 1 }),
  ]) {
    const f = await fixture()
    expect((await invocation({ store: f.store(), proof, mark }).run()).success).toBe(false)
    const saved = await f.load()
    expect(saved.ownedResources).toEqual([])
    expect(saved.ssoSignIn?.completedStepIds).toEqual(e2eSsoStepIds.slice(0, 2))
    expect(await readFile(f.checkpointPath, "utf8")).not.toContain("token-unregistered")
  }
})

test("SSO ownership refuses baseline/shared, wrong-user, old, future, and ambiguous token sessions", () => {
  const proof = session("owned")
  const input = {
    sessions: [proof],
    e2eRunId: "test-run",
    ownedAt: start,
    baselineSessionIds: [],
    startedAt: start + 10,
    now: start + 100,
    browser: { userId: proof.userId, tokenDigest: proof.tokenDigest },
  }
  expect(e2eSsoSessionOwnershipProve(input)).toEqual(createResult(proof))
  for (const override of [
    { baselineSessionIds: [proof.sessionId] },
    { browser: { ...input.browser, userId: "another-user" } },
    { startedAt: proof.creationTime + 1 },
    { now: proof.creationTime - 1 },
    { sessions: [proof, { ...proof, sessionId: "same-second-login" }] },
    { sessions: [{ ...proof, createdAt: new Date(start - 100).toISOString() }] },
    { sessions: [{ ...proof, createdAt: "invalid" }] },
    { sessions: [{ ...proof, e2eRunId: "other-run" }] },
    { sessions: [{ ...proof, ownedAt: start + 1 }] },
  ])
    expect(e2eSsoSessionOwnershipProve({ ...input, ...override }).success).toBe(false)
})

test("SSO resume rejects account/backend or remote session creation mismatch without overwriting evidence", async () => {
  const f = await fixture()
  const original = session("first")
  await invocation({ store: f.store(), proof: original, failAt: "overview-verify" }).run()
  const before = await readFile(f.checkpointPath, "utf8")
  for (const override of [
    { backendUrl: "https://other.example.test" },
    { accountKey: "b".repeat(64) },
    { sessionsRead: async () => createResult([{ ...original, creationTime: original.creationTime + 1 }]) },
  ]) {
    let browserCalled = false
    const result = await e2eSsoWorkflowRun({
      store: f.store(),
      backendUrl,
      accountKey,
      sessionsRead: async () => createResult([original]),
      sessionMark: async () => createResult(original),
      browserSessionRead: async () =>
        createResult({ userId: original.userId, token: "token-first", tokenDigest: original.tokenDigest }),
      steps: Object.fromEntries(
        e2eSsoStepIds.map((id) => [
          id,
          async () => {
            browserCalled = true
            return createResult(undefined)
          },
        ]),
      ) as Parameters<typeof e2eSsoWorkflowRun>[0]["steps"],
      ...override,
    })
    expect(result.success).toBe(false)
    expect(browserCalled).toBe(false)
    expect(await readFile(f.checkpointPath, "utf8")).toBe(before)
  }
})

test("SSO safely reauthenticates when prior exact session is missing and retains its original evidence", async () => {
  const f = await fixture()
  const original = session("expired")
  await invocation({ store: f.store(), proof: original, failAt: "overview-verify" }).run()
  const resumed = invocation({ store: f.store(), proof: session("fresh", start + 2020), startedAt: start + 2000 })
  expect((await resumed.run()).success).toBe(true)
  expect((await f.load()).ownedResources[0]?.sessionProof).toEqual(original)
})

test("SSO ownership registration is idempotent and never refreshes session creation time", async () => {
  const f = await fixture()
  const proof = session("first")
  const store = f.store()
  expect((await store.register(proof)).success).toBe(true)
  expect((await store.register(proof)).success).toBe(true)
  expect((await f.load()).ownedResources).toHaveLength(1)
  const before = await readFile(f.checkpointPath, "utf8")
  expect((await store.register({ ...proof, creationTime: start + 900 })).success).toBe(false)
  expect(await readFile(f.checkpointPath, "utf8")).toBe(before)
})

test("SSO reconciles a durable browser observation after interrupted ownership registration", async () => {
  const f = await fixture()
  const first = session("interrupted")
  const store = f.store()
  const result = await e2eSsoWorkflowRun({
    store,
    backendUrl,
    accountKey,
    now: () => start + 10,
    sessionsRead: (() => {
      let reads = 0
      return async () => (reads++ === 0 ? createResult([]) : createResultError("read", "interrupted API"))
    })(),
    sessionMark: async () => createResult(first),
    browserSessionRead: async () =>
      createResult({ userId: first.userId, token: "token-interrupted", tokenDigest: first.tokenDigest }),
    steps: Object.fromEntries(e2eSsoStepIds.map((id) => [id, async () => createResult(undefined)])) as Parameters<
      typeof e2eSsoWorkflowRun
    >[0]["steps"],
  })
  expect(result.success).toBe(false)
  expect((await f.load()).ownedResources).toHaveLength(0)
  expect((await f.load()).ssoSignIn?.attempts[0]?.browser?.tokenDigest).toBe(first.tokenDigest)
  const resumed = invocation({
    store: f.store(),
    proof: session("new", start + 2120),
    baseline: [first],
    startedAt: start + 2000,
  })
  expect((await resumed.run()).success).toBe(true)
  const saved = await f.load()
  expect(saved.ownedResources.map((entry) => entry.sessionProof?.sessionId)).toEqual(["interrupted", "new"])
  expect(saved.ownedResources[0]?.createdAt).toBe(first.creationTime)
  expect(saved.ssoSignIn?.attempts[0]?.sessionResourceId).toContain("session-interrupted")
})

test("SSO checkpoint saves preserve resources registered after a workflow snapshot", async () => {
  const f = await fixture()
  const store = f.store()
  const snapshot = await f.load()
  expect((await store.register(session("registered-later"))).success).toBe(true)
  expect((await store.save(snapshot)).success).toBe(true)
  expect((await f.load()).ownedResources[0]?.sessionProof?.sessionId).toBe("registered-later")
})

test("canonical Valibot state rejects reordered steps and secrets inside session ownership proof", async () => {
  const f = await fixture()
  const state = { backendUrl, accountKey, attempts: [], completedStepIds: ["password-submit"] }
  expect(v.safeParse(e2eCheckpointSchema, { ...f.checkpoint, ssoSignIn: state }).success).toBe(false)
  expect(
    v.safeParse(e2eCheckpointSchema, {
      ...f.checkpoint,
      ownedResources: [
        {
          resourceType: "auth-session",
          resourceId: "id",
          ownerRunId: f.checkpoint.runId,
          createdAt: start,
          sessionProof: { ...session("first"), token: "must-not-persist" },
        },
      ],
    }).success,
  ).toBe(false)
  await Bun.write(f.checkpointPath, "malformed")
  expect((await f.store().load()).success).toBe(false)
  expect(await readFile(f.checkpointPath, "utf8")).toBe("malformed")
})

test("SSO session transport uses cursor pages and exposes only hashed metadata, not tokens/admin keys", async () => {
  const cursors: unknown[] = []
  const read = e2eSsoSessionTransportCreate({
    backendUrl,
    adminKey: "admin-secret",
    fetch: (async (_url, init) => {
      const body = JSON.parse(init!.body as string)
      cursors.push(body.args[0].paginationOpts.cursor)
      expect(body.path).toBe("_system/cli/tableData")
      expect(body.args[0].paginationOpts.numItems).toBe(100)
      return Response.json({
        status: "success",
        value: {
          isDone: cursors.length === 2,
          continueCursor: "cursor-1",
          page: [
            {
              _id: `session-${cursors.length}`,
              _creationTime: start,
              userId: "shared-user",
              token: "browser-secret",
              createdAt: new Date(start).toISOString(),
              e2eRunId: "test-run",
              e2eOwnedAt: start,
            },
          ],
        },
      })
    }) as typeof fetch,
  })
  const result = await read()
  expect(result.success).toBe(true)
  expect(cursors).toEqual([null, "cursor-1"])
  expect(JSON.stringify(result)).not.toContain("browser-secret")
  expect(JSON.stringify(result)).not.toContain("admin-secret")
  if (result.success) {
    expect(result.data[0]?.tokenDigest).toBe(digest("browser-secret"))
    expect(result.data[0]?.e2eRunId).toBe("test-run")
    expect(result.data[0]?.ownedAt).toBe(start)
  }
})

test("runner preserves SSO step/session evidence on failure and fails closed pending task2 session cleanup adapter", async () => {
  const f = await fixture()
  const root = join(f.checkpointPath, "..", "runner")
  let path = ""
  let runnerNow = start
  const options = {
    target: "production" as const,
    baseUrl: f.checkpoint.baseUrl,
    checkpointDirectory: root,
    suitePaths: ["e2e/workflows/ssoSignIn/ssoSignIn.test.ts"],
    now: () => runnerNow,
    runSuite: async (_suite: string, context: { checkpointPath: string; runId: string }) => {
      path = context.checkpointPath
      runnerNow = start + 100
      const result = await invocation({
        proof: { ...session("runner"), e2eRunId: context.runId },
        failAt: "overview-verify",
        store: e2eSsoCheckpointStoreCreate({ ...context, target: "production", baseUrl: f.checkpoint.baseUrl }),
      }).run()
      if (!result.success) throw new Error(result.errorMessage)
    },
  }
  await expect(e2eRunnerRun(options)).rejects.toThrow("controlled failure")
  const failed = JSON.parse(await readFile(path, "utf8")) as E2eCheckpoint
  expect(failed.ssoSignIn?.completedStepIds).toEqual(e2eSsoStepIds.slice(0, 3))
  expect(failed.ownedResources[0]?.sessionProof?.sessionId).toBe("runner")
  await expect(e2eRunnerRun({ ...options, runSuite: async () => {} })).rejects.toThrow(
    "No verified E2E cleanup adapter",
  )
  const retained = JSON.parse(await readFile(path, "utf8")) as E2eCheckpoint
  expect(retained.completedSuiteIds).toEqual(options.suitePaths)
  expect(retained.ownedResources).toEqual(failed.ownedResources)
})
