import { expect, test } from "bun:test"
import { e2eSessionCleanupCreate } from "./e2eSessionCleanupCreate.ts"

const cutoff = 1_000_000_000
const now = () => cutoff + 86_400_000
const ok = (data: unknown) => ({ success: true, data })

test("stale cleanup paginates, groups exact markers, batches and verifies the same cutoff", async () => {
  const calls: { name: string; args: any }[] = []
  let queries = 0
  let mutations = 0
  const admin = { async function(name: string, _: undefined, args: never) {
    calls.push({ name, args })
    if (name.includes("StaleList")) {
      queries++
      if (queries === 1) return ok({ page: [{ e2eRunId: "a", ownedAt: 1 }], isDone: false, continueCursor: "next" })
      if (queries === 2) return ok({ page: [{ e2eRunId: "a", ownedAt: 1 }, { e2eRunId: "a", ownedAt: 2 }], isDone: true, continueCursor: "" })
      return ok({ page: [], isDone: true, continueCursor: "" })
    }
    mutations++
    return ok({ deletedCount: 1, verifiedAbsent: mutations !== 1 })
  } }
  await e2eSessionCleanupCreate({ target: "dev", now, admin }).cleanupStale()
  expect(calls.filter(c => c.name.includes("StaleList")).map(c => c.args)).toEqual([
    { createdBefore: cutoff, paginationOpts: { cursor: null, numItems: 100 } },
    { createdBefore: cutoff, paginationOpts: { cursor: "next", numItems: 100 } },
    { createdBefore: cutoff, paginationOpts: { cursor: null, numItems: 100 } },
  ])
  expect(calls.filter(c => c.name.includes("Cleanup")).map(c => c.args)).toEqual([
    { e2eRunId: "a", ownedAt: 1, createdBefore: cutoff },
    { e2eRunId: "a", ownedAt: 1, createdBefore: cutoff },
    { e2eRunId: "a", ownedAt: 2, createdBefore: cutoff },
  ])
})

test("current cleanup uses checkpoint run ownership without stale cutoff and rejects other resources", async () => {
  const calls: unknown[] = []
  const adapter = e2eSessionCleanupCreate({ target: "dev", admin: { async function(_name, _component, args) { calls.push(args); return ok({ deletedCount: 0, verifiedAbsent: true }) } } })
  const checkpoint = { environment: "dev", runId: "run", createdAt: 123 } as any
  const resource = { resourceType: "auth-session", resourceId: "e2e-run-session-id", ownerRunId: "run", sessionProof: { sessionId: "id" } } as any
  await adapter.cleanupResource(resource, checkpoint)
  expect(calls).toEqual([{ e2eRunId: "run", ownedAt: 123 }])
  await expect(adapter.cleanupResource({ ...resource, ownerRunId: "other" }, checkpoint)).rejects.toThrow()
  await expect(adapter.cleanupResource({ ...resource, resourceType: "user" }, checkpoint)).rejects.toThrow()
  expect(calls).toHaveLength(1)
})

test("cleanup continues failed groups, verifies absence and retries on next invocation", async () => {
  let fail = true
  const remaining = new Set(["a", "b"])
  const attempts: string[] = []
  const admin = { async function(name: string, _: undefined, args: never) {
    const input = args as { e2eRunId: string }
    if (name.includes("StaleList")) return ok({ page: [...remaining].map(e2eRunId => ({ e2eRunId, ownedAt: 1 })), isDone: true, continueCursor: "" })
    attempts.push(input.e2eRunId)
    if (input.e2eRunId === "a" && fail) return { success: false, errorMessage: "failure" }
    remaining.delete(input.e2eRunId)
    return ok({ deletedCount: 1, verifiedAbsent: true })
  } }
  const adapter = e2eSessionCleanupCreate({ target: "dev", now, admin })
  await expect(adapter.cleanupStale()).rejects.toThrow("Stale E2E session cleanup failed")
  expect(attempts).toEqual(["a", "b"])
  fail = false
  await adapter.cleanupStale()
  expect(attempts).toEqual(["a", "b", "a"])
})

test("refuses a partial E2E_CONVEX override instead of mixing env sources", async () => {
  const previousUrl = process.env.E2E_CONVEX_URL
  const previousKey = process.env.E2E_CONVEX_ADMIN_KEY
  process.env.E2E_CONVEX_URL = "https://override.example.com"
  delete process.env.E2E_CONVEX_ADMIN_KEY
  try {
    await expect(e2eSessionCleanupCreate({ target: "dev", now }).cleanupStale()).rejects.toThrow(
      "both E2E_CONVEX_URL",
    )
  } finally {
    if (previousUrl === undefined) delete process.env.E2E_CONVEX_URL
    else process.env.E2E_CONVEX_URL = previousUrl
    if (previousKey === undefined) delete process.env.E2E_CONVEX_ADMIN_KEY
    else process.env.E2E_CONVEX_ADMIN_KEY = previousKey
  }
})

test("stale cleanup rejects markers at the cutoff without deleting", async () => {
  let mutations = 0
  const admin = { async function(name: string) {
    if (name.includes("StaleList")) return ok({ page: [{ e2eRunId: "recent", ownedAt: cutoff }], isDone: true, continueCursor: "" })
    mutations++
    return undefined
  } }
  await expect(e2eSessionCleanupCreate({ target: "dev", now, admin }).cleanupStale()).rejects.toThrow()
  expect(mutations).toBe(0)
})
