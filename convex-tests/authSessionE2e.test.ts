/// <reference types="vite/client" />

import { convexTest } from "convex-test"
import { afterEach, expect, test, vi } from "vitest"
import { api, internal } from "../convex/_generated/api.js"
import schema from "../convex/schema.js"
import { apiKeyCredentialHash } from "../src/auth/model/apiKeyCredentialHash.ts"
import { tokenCreate } from "../src/auth/server/jwt_token/tokenCreate.ts"

const modules = import.meta.glob("../convex/**/*.ts")
const now = Date.parse("2026-11-05T12:00:00.000Z")
const cutoff = now - 86_400_000
const secret = "auth-session-e2e-unit-test-secret"

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
})

async function fixtureCreate() {
  vi.useFakeTimers({ toFake: ["Date"] })
  vi.setSystemTime(cutoff - 10000)
  vi.stubEnv("AUTH_SECRET", secret)
  const t = convexTest(schema, modules)
  const timestamps = { createdAt: new Date(now).toISOString(), updatedAt: new Date(now).toISOString() }
  const ids = await t.run(async (ctx) => ({
    userId: await ctx.db.insert("users", { name: "Shared test identity", role: "user", ...timestamps }),
    otherId: await ctx.db.insert("users", { name: "Other user", role: "user", ...timestamps }),
    adminId: await ctx.db.insert("users", { name: "Administrator", role: "admin", ...timestamps }),
  }))
  vi.setSystemTime(now)
  vi.stubEnv("E2E_AUTH_USER_ID", ids.userId)
  const token = await tokenCreate(ids.userId, secret, { nonce: "caller" })
  const sharedToken = await tokenCreate(ids.userId, secret, { nonce: "shared" })
  const otherToken = await tokenCreate(ids.otherId, secret)
  const adminToken = await tokenCreate(ids.adminId, secret)
  async function sessionInsert(
    sessionToken = token,
    userId = ids.userId,
    createdAt = now,
    ownership?: { e2eRunId: string; e2eOwnedAt: number },
  ) {
    vi.setSystemTime(createdAt)
    const sessionId = await t.run((ctx) =>
      ctx.db.insert("authSessions", {
        userId,
        token: sessionToken,
        loginMethod: "oidc",
        createdAt: new Date(createdAt).toISOString(),
        updatedAt: new Date(createdAt).toISOString(),
        expiresAt: new Date(now + 86_400_000).toISOString(),
        ...ownership,
      }),
    )
    vi.setSystemTime(now)
    return sessionId
  }
  return { t, ...ids, token, sharedToken, otherToken, adminToken, sessionInsert }
}

test("marking identifies only the caller session and never returns credentials", async () => {
  const { t, token, sharedToken, sessionInsert } = await fixtureCreate()
  const callerId = await sessionInsert()
  const sharedId = await sessionInsert(sharedToken)
  const args = { token, e2eRunId: "run-one", ownedAt: now - 1000 }
  const marked = await t.mutation(api.auth.authSessionE2eMarkMutation, args)
  expect(marked.success).toBe(true)
  expect(JSON.stringify(marked)).not.toContain(token)
  if (marked.success) expect(marked.data.sessionId).toBe(callerId)
  expect(await t.mutation(api.auth.authSessionE2eMarkMutation, args)).toEqual(marked)
  expect((await t.mutation(api.auth.authSessionE2eMarkMutation, { ...args, e2eRunId: "another-run" })).success).toBe(
    false,
  )
  expect((await t.mutation(api.auth.authSessionE2eMarkMutation, { ...args, ownedAt: now - 2000 })).success).toBe(false)
  expect(await t.run(async (ctx) => (await ctx.db.get("authSessions", sharedId))?.e2eRunId)).toBeNull()
})

test("marking rejects non-test identities including admins, missing config, API keys and ambiguous tokens", async () => {
  const f = await fixtureCreate()
  await f.sessionInsert(f.otherToken, f.otherId)
  await f.sessionInsert(f.adminToken, f.adminId)
  const ownership = { e2eRunId: "run-auth", ownedAt: now - 1000 }
  for (const token of [f.otherToken, f.adminToken, "invalid-token"]) {
    expect((await f.t.mutation(api.auth.authSessionE2eMarkMutation, { token, ...ownership })).success).toBe(false)
  }
  const apiKey = "c".repeat(64)
  const digest = await apiKeyCredentialHash(apiKey)
  await f.t.run((ctx) =>
    ctx.db.insert("authApiKeys", {
      userId: f.userId,
      name: "Test key",
      digest,
      previewFirst3: "ccc",
      previewLast3: "ccc",
      createdAt: new Date(now).toISOString(),
    }),
  )
  expect((await f.t.mutation(api.auth.authSessionE2eMarkMutation, { token: apiKey, ...ownership })).success).toBe(false)
  await f.sessionInsert()
  vi.stubEnv("E2E_AUTH_USER_ID", "")
  expect((await f.t.mutation(api.auth.authSessionE2eMarkMutation, { token: f.token, ...ownership })).success).toBe(
    false,
  )
  vi.stubEnv("E2E_AUTH_USER_ID", f.userId)
  await f.sessionInsert()
  expect((await f.t.mutation(api.auth.authSessionE2eMarkMutation, { token: f.token, ...ownership })).success).toBe(
    false,
  )
})

test("marking refuses sessions predating the run and cannot redirect to another user's row", async () => {
  const f = await fixtureCreate()
  const id = await f.sessionInsert()
  expect(
    (
      await f.t.mutation(api.auth.authSessionE2eMarkMutation, {
        token: f.token,
        e2eRunId: "run-future",
        ownedAt: now + 1,
      })
    ).success,
  ).toBe(false)
  await f.t.run((ctx) => ctx.db.patch("authSessions", id, { userId: f.otherId }))
  expect(
    (
      await f.t.mutation(api.auth.authSessionE2eMarkMutation, {
        token: f.token,
        e2eRunId: "run-wrong-owner",
        ownedAt: now - 1,
      })
    ).success,
  ).toBe(false)
})

test("historical discovery is internal, paginated, token-free and strictly older than 24 hours", async () => {
  const f = await fixtureCreate()
  const stale = { e2eRunId: "run-stale", e2eOwnedAt: cutoff - 2000 }
  const staleId = await f.sessionInsert("stale-session", f.userId, cutoff - 1000, stale)
  await f.sessionInsert("exact-cutoff", f.userId, cutoff, { e2eRunId: "run-boundary", e2eOwnedAt: cutoff })
  await f.sessionInsert("recent-session", f.userId, now, { e2eRunId: "run-recent", e2eOwnedAt: now - 1000 })
  await f.sessionInsert("shared-old-unmarked", f.userId, now)
  await f.sessionInsert("other-user-marked", f.otherId, now, stale)
  const args = { createdBefore: cutoff, paginationOpts: { numItems: 1, cursor: null } }
  const result = await f.t.query(internal.auth.authSessionE2eStaleListInternalQuery, args)
  expect(result.success).toBe(true)
  if (result.success) {
    expect(result.data.page.map((entry) => entry.sessionId)).toEqual([staleId])
    expect(JSON.stringify(result)).not.toContain("stale-session")
  }
  expect(
    (await f.t.query(internal.auth.authSessionE2eStaleListInternalQuery, { ...args, createdBefore: cutoff + 60_000 }))
      .success,
  ).toBe(false)
})

test("exact run cleanup verifies deletion, retains shared user/unmarked/other-run sessions, and retries idempotently", async () => {
  const f = await fixtureCreate()
  const ownership = { e2eRunId: "run-clean", ownedAt: now - 1000 }
  const removed = await f.sessionInsert()
  await f.t.mutation(api.auth.authSessionE2eMarkMutation, { token: f.token, ...ownership })
  const retained = [
    await f.sessionInsert(f.sharedToken),
    await f.sessionInsert("other-run", f.userId, now, { e2eRunId: "other-run", e2eOwnedAt: ownership.ownedAt }),
    await f.sessionInsert("other-owner", f.otherId, now, {
      e2eRunId: ownership.e2eRunId,
      e2eOwnedAt: ownership.ownedAt,
    }),
  ]
  const result = await f.t.mutation(internal.auth.authSessionE2eRunCleanupInternalMutation, { ...ownership })
  expect(result).toMatchObject({ success: true, data: { deletedCount: 1, verifiedAbsent: true } })
  expect(await f.t.run((ctx) => ctx.db.get("authSessions", removed))).toBeNull()
  for (const id of retained) expect(await f.t.run((ctx) => ctx.db.get("authSessions", id))).not.toBeNull()
  expect(await f.t.run((ctx) => ctx.db.get("users", f.userId))).not.toBeNull()
  expect(await f.t.mutation(internal.auth.authSessionE2eRunCleanupInternalMutation, { ...ownership })).toMatchObject({
    success: true,
    data: { deletedCount: 0, verifiedAbsent: true },
  })
})

test("stale cleanup enforces strict cutoff on original ownership and actual session creation", async () => {
  const f = await fixtureCreate()
  const ownership = { e2eRunId: "run-stale", ownedAt: cutoff - 2000 }
  const staleId = await f.sessionInsert("stale", f.userId, cutoff - 1000, {
    e2eRunId: ownership.e2eRunId,
    e2eOwnedAt: ownership.ownedAt,
  })
  const boundaryId = await f.sessionInsert("boundary", f.userId, cutoff, {
    e2eRunId: ownership.e2eRunId,
    e2eOwnedAt: ownership.ownedAt,
  })
  const args = { ...ownership, createdBefore: cutoff }
  expect(
    (await f.t.mutation(internal.auth.authSessionE2eRunCleanupInternalMutation, { ...args, ownedAt: cutoff })).success,
  ).toBe(false)
  expect(
    (
      await f.t.mutation(internal.auth.authSessionE2eRunCleanupInternalMutation, {
        ...args,
        createdBefore: cutoff + 60_000,
      })
    ).success,
  ).toBe(false)
  expect(await f.t.mutation(internal.auth.authSessionE2eRunCleanupInternalMutation, args)).toMatchObject({
    success: true,
    data: { deletedCount: 1, verifiedAbsent: false },
  })
  expect(await f.t.run((ctx) => ctx.db.get("authSessions", staleId))).toBeNull()
  expect(await f.t.run((ctx) => ctx.db.get("authSessions", boundaryId))).not.toBeNull()
  // The remaining young row must stay discoverable; an empty discovery result
  // would incorrectly let the finalizer report verified absence on a later run.
  const remaining = await f.t.query(internal.auth.authSessionE2eStaleListInternalQuery, {
    createdBefore: cutoff,
    paginationOpts: { numItems: 100, cursor: null },
  })
  expect(remaining).toMatchObject({
    success: true,
    data: { page: [{ sessionId: boundaryId, e2eRunId: ownership.e2eRunId, ownedAt: ownership.ownedAt }] },
  })
})
