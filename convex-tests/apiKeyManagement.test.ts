/// <reference types="vite/client" />

import { convexTest } from "convex-test"
import { expect, test } from "vitest"
import { api, internal } from "../convex/_generated/api.js"
import schema from "../convex/schema.js"
import { apiKeyCredentialGenerate } from "../src/auth/model/apiKeyCredentialGenerate.ts"
import { apiKeyCredentialHash } from "../src/auth/model/apiKeyCredentialHash.ts"
import { tokenCreate } from "../src/auth/server/jwt_token/tokenCreate.ts"

const modules = import.meta.glob("../convex/**/*.ts")

test("API key management issues one-time secrets, enforces ownership, rotates atomically, and lists status metadata", async () => {
  const t = convexTest(schema, modules)
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error("AUTH_SECRET is required for API key management tests")
  const userIds = await t.run(async (ctx) => {
    const createdAt = new Date().toISOString()
    const first = await ctx.db.insert("users", { name: "First", role: "user", createdAt, updatedAt: createdAt })
    const second = await ctx.db.insert("users", { name: "Second", role: "user", createdAt, updatedAt: createdAt })
    return [first, second] as const
  })
  const firstToken = await tokenCreate(userIds[0], secret)
  const otherToken = await tokenCreate(userIds[1], secret)

  const created = await t.mutation(api.auth.apiKeyCreateMutation, { token: firstToken, name: "  deploy  " })
  expect(created.success).toBe(true)
  if (!created.success) return
  expect(created.data.credential).toMatch(/^[0-9a-f]{64}$/)
  const keyId = created.data.id as never

  const persisted = await t.run((ctx) => ctx.db.get("authApiKeys", keyId))
  expect(persisted?.name).toBe("deploy")
  expect(persisted?.digest).not.toBe(created.data.credential)
  expect(JSON.stringify(persisted)).not.toContain(created.data.credential)
  expect(persisted?.expiresAt).toBeDefined()

  const unauthorizedList = await t.query(api.auth.apiKeyListQuery, {
    token: otherToken,
    paginationOpts: { numItems: 10, cursor: null },
  })
  expect(unauthorizedList.success).toBe(true)
  if (unauthorizedList.success) expect(unauthorizedList.data.page).toHaveLength(0)
  const crossUserRevoke = await t.mutation(api.auth.apiKeyRevokeMutation, { token: otherToken, id: keyId })
  expect(crossUserRevoke.success).toBe(false)

  const rotated = await t.mutation(api.auth.apiKeyRotateMutation, { token: firstToken, id: keyId })
  expect(rotated.success).toBe(true)
  if (!rotated.success) return
  expect(rotated.data.credential).not.toBe(created.data.credential)
  const previous = await t.run((ctx) => ctx.db.get("authApiKeys", keyId))
  const replacement = await t.run((ctx) => ctx.db.get("authApiKeys", rotated.data.id as never))
  expect(previous?.revokedAt).toBeDefined()
  expect(replacement?.digest).not.toBe(rotated.data.credential)
  expect(replacement?.expiresAt).toBe(previous?.expiresAt)

  const revoked = await t.mutation(api.auth.apiKeyRevokeMutation, { token: firstToken, id: rotated.data.id as never })
  expect(revoked.success).toBe(true)
  const listed = await t.query(api.auth.apiKeyListQuery, {
    token: firstToken,
    paginationOpts: { numItems: 10, cursor: null },
  })
  expect(listed.success).toBe(true)
  if (listed.success) {
    expect(listed.data.page).toHaveLength(2)
    expect(listed.data.page.map((key) => key.status)).toEqual(["revoked", "revoked"])
    expect(JSON.stringify(listed.data)).not.toContain(created.data.credential)
    expect(JSON.stringify(listed.data)).not.toContain(rotated.data.credential)
  }

  const hardDelete = await t.mutation(internal.auth.userDeleteHardInternalMutation, { userId: userIds[0] })
  expect(hardDelete.success).toBe(true)
  const deletedUserKeys = await t.run((ctx) =>
    ctx.db
      .query("authApiKeys")
      .withIndex("userId", (q) => q.eq("userId", userIds[0]))
      .take(10),
  )
  expect(deletedUserKeys).toHaveLength(0)
})

test("API key creation rejects blank, oversized, and unsupported expiry input", async () => {
  const t = convexTest(schema, modules)
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error("AUTH_SECRET is required for API key management tests")
  const userId = await t.run(async (ctx) => {
    const createdAt = new Date().toISOString()
    return ctx.db.insert("users", { name: "Test", role: "user", createdAt, updatedAt: createdAt })
  })
  const token = await tokenCreate(userId, secret)

  expect((await t.mutation(api.auth.apiKeyCreateMutation, { token, name: "   " })).success).toBe(false)
  expect((await t.mutation(api.auth.apiKeyCreateMutation, { token, name: "x".repeat(81) })).success).toBe(false)
  await expect(
    t.mutation(api.auth.apiKeyCreateMutation, { token, name: "valid", expiryPreset: "2-months" as never }),
  ).rejects.toThrow()
})

test("API key rename trims the name and preserves credential metadata on expired revoked keys", async () => {
  const t = convexTest(schema, modules)
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error("AUTH_SECRET is required for API key management tests")
  const keyId = await t.run(async (ctx) => {
    const createdAt = new Date().toISOString()
    const userId = await ctx.db.insert("users", { name: "Owner", role: "user", createdAt, updatedAt: createdAt })
    return ctx.db.insert("authApiKeys", {
      userId,
      name: "before",
      digest: "credential-digest",
      previewFirst3: "abc",
      previewLast3: "xyz",
      createdAt,
      expiresAt: "2000-01-01T00:00:00.000Z",
      revokedAt: createdAt,
    })
  })
  const userId = await t.run(async (ctx) => (await ctx.db.get("authApiKeys", keyId))!.userId)
  const token = await tokenCreate(userId, secret)
  const before = await t.run((ctx) => ctx.db.get("authApiKeys", keyId))

  const renamed = await t.mutation(api.auth.apiKeyRenameMutation, { token, id: keyId, name: "  production deploy  " })

  expect(renamed.success).toBe(true)
  const after = await t.run((ctx) => ctx.db.get("authApiKeys", keyId))
  expect(after).toEqual({ ...before, name: "production deploy" })
})

test("API key rename denies foreign and missing IDs with the same not-found response", async () => {
  const t = convexTest(schema, modules)
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error("AUTH_SECRET is required for API key management tests")
  const users = await t.run(async (ctx) => {
    const createdAt = new Date().toISOString()
    const ownerId = await ctx.db.insert("users", { name: "Owner", role: "user", createdAt, updatedAt: createdAt })
    const otherId = await ctx.db.insert("users", { name: "Other", role: "user", createdAt, updatedAt: createdAt })
    const keyId = await ctx.db.insert("authApiKeys", {
      userId: ownerId,
      name: "owned",
      digest: "credential-digest",
      previewFirst3: "abc",
      previewLast3: "xyz",
      createdAt,
    })
    const missingId = await ctx.db.insert("authApiKeys", {
      userId: ownerId,
      name: "deleted",
      digest: "deleted-digest",
      previewFirst3: "abc",
      previewLast3: "xyz",
      createdAt,
    })
    await ctx.db.delete("authApiKeys", missingId)
    return { otherId, keyId, missingId }
  })
  const token = await tokenCreate(users.otherId, secret)

  const foreign = await t.mutation(api.auth.apiKeyRenameMutation, { token, id: users.keyId, name: "changed" })
  const missing = await t.mutation(api.auth.apiKeyRenameMutation, {
    token,
    id: users.missingId,
    name: "changed",
  })

  expect(foreign).toEqual(missing)
  expect(foreign.success).toBe(false)
  expect(await t.run((ctx) => ctx.db.get("authApiKeys", users.keyId))).toMatchObject({ name: "owned" })
})

test("API key rename rejects blank and oversized names", async () => {
  const t = convexTest(schema, modules)
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error("AUTH_SECRET is required for API key management tests")
  const { userId, keyId } = await t.run(async (ctx) => {
    const createdAt = new Date().toISOString()
    const userId = await ctx.db.insert("users", { name: "Owner", role: "user", createdAt, updatedAt: createdAt })
    const keyId = await ctx.db.insert("authApiKeys", {
      userId,
      name: "original",
      digest: "credential-digest",
      previewFirst3: "abc",
      previewLast3: "xyz",
      createdAt,
    })
    return { userId, keyId }
  })
  const token = await tokenCreate(userId, secret)

  expect((await t.mutation(api.auth.apiKeyRenameMutation, { token, id: keyId, name: "   " })).success).toBe(false)
  expect((await t.mutation(api.auth.apiKeyRenameMutation, { token, id: keyId, name: "x".repeat(81) })).success).toBe(
    false,
  )
  expect(await t.run((ctx) => ctx.db.get("authApiKeys", keyId))).toMatchObject({ name: "original" })
})

test("API key listing marks expired keys and supports keys without expiry", async () => {
  const t = convexTest(schema, modules)
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error("AUTH_SECRET is required for API key management tests")
  const userId = await t.run(async (ctx) => {
    const createdAt = new Date().toISOString()
    return ctx.db.insert("users", { name: "Test", role: "user", createdAt, updatedAt: createdAt })
  })
  const token = await tokenCreate(userId, secret)
  const finite = await t.mutation(api.auth.apiKeyCreateMutation, { token, name: "finite" })
  const never = await t.mutation(api.auth.apiKeyCreateMutation, { token, name: "never", expiryPreset: "never" })
  expect(finite.success).toBe(true)
  expect(never.success).toBe(true)
  if (!finite.success || !never.success) return

  await t.run((ctx) => ctx.db.patch("authApiKeys", finite.data.id as never, { expiresAt: "2000-01-01T00:00:00.000Z" }))
  const listed = await t.query(api.auth.apiKeyListQuery, {
    token,
    paginationOpts: { numItems: 10, cursor: null },
  })
  expect(listed.success).toBe(true)
  if (listed.success) {
    expect(listed.data.page.find((key) => key.id === finite.data.id)?.status).toBe("expired")
    expect(listed.data.page.find((key) => key.id === never.data.id)?.status).toBe("active")
    expect(listed.data.page.find((key) => key.id === never.data.id)?.expiresAt).toBeUndefined()
  }
})

test("API key expiry marker invalidates a live key and safely ignores terminal keys", async () => {
  const t = convexTest(schema, modules)
  const credential = apiKeyCredentialGenerate().credential
  const digest = await apiKeyCredentialHash(credential)
  const userId = await t.run(async (ctx) => {
    const createdAt = new Date().toISOString()
    const userId = await ctx.db.insert("users", { name: "Test", role: "user", createdAt, updatedAt: createdAt })
    const finite = await ctx.db.insert("authApiKeys", {
      userId,
      name: "finite",
      digest,
      previewFirst3: "abc",
      previewLast3: "xyz",
      createdAt,
      expiresAt: "2000-01-01T00:00:00.000Z",
    })
    const revoked = await ctx.db.insert("authApiKeys", {
      userId,
      name: "revoked",
      digest: "revoked-digest",
      previewFirst3: "abc",
      previewLast3: "xyz",
      createdAt,
      expiresAt: "2000-01-01T00:00:00.000Z",
      revokedAt: createdAt,
    })
    const deleted = await ctx.db.insert("authApiKeys", {
      userId,
      name: "deleted",
      digest: "deleted-digest",
      previewFirst3: "abc",
      previewLast3: "xyz",
      createdAt,
      expiresAt: "2000-01-01T00:00:00.000Z",
    })
    await ctx.db.delete("authApiKeys", deleted)
    return { finite, revoked, deleted }
  })

  await t.mutation(internal.auth.apiKeyExpireInternalMutation, { id: userId.finite })
  await t.mutation(internal.auth.apiKeyExpireInternalMutation, { id: userId.revoked })
  await t.mutation(internal.auth.apiKeyExpireInternalMutation, { id: userId.deleted })
  const marker = await t.run((ctx) => ctx.db.get("authApiKeys", userId.finite))
  const revoked = await t.run((ctx) => ctx.db.get("authApiKeys", userId.revoked))
  expect(marker?.expiredAt).toBeDefined()
  expect(revoked?.expiredAt).toBeUndefined()
  expect(await t.run((ctx) => ctx.db.get("authApiKeys", userId.deleted))).toBeNull()
  const resolved = await t.query(internal.auth.apiKeyCredentialResolveQuery, { credential })
  expect(resolved.success).toBe(false)
})

test("API key rotation rejects an expired key without modifying or inserting keys", async () => {
  const t = convexTest(schema, modules)
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error("AUTH_SECRET is required for API key management tests")
  const userId = await t.run(async (ctx) => {
    const createdAt = new Date().toISOString()
    const userId = await ctx.db.insert("users", { name: "Test", role: "user", createdAt, updatedAt: createdAt })
    return ctx.db.insert("authApiKeys", {
      userId,
      name: "expired",
      digest: "expired-digest",
      previewFirst3: "abc",
      previewLast3: "xyz",
      createdAt,
      expiresAt: "2000-01-01T00:00:00.000Z",
    })
  })
  const token = await tokenCreate((await t.run((ctx) => ctx.db.get("authApiKeys", userId)))!.userId, secret)
  const before = await t.run((ctx) => ctx.db.query("authApiKeys").collect())
  const rotated = await t.mutation(api.auth.apiKeyRotateMutation, { token, id: userId })
  const after = await t.run((ctx) => ctx.db.query("authApiKeys").collect())

  expect(rotated.success).toBe(false)
  expect(after).toHaveLength(before.length)
  expect(after[0].revokedAt).toBeUndefined()
})
