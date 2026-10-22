/// <reference types="vite/client" />

import { convexTest } from "convex-test"
import { expect, test } from "vitest"
import { api, internal } from "../convex/_generated/api.js"
import schema from "../convex/schema.js"
import { apiKeyCredentialHash } from "../src/auth/model/apiKeyCredentialHash.ts"
import { tokenCreate } from "../src/auth/server/jwt_token/tokenCreate.ts"

const modules = import.meta.glob("../convex/**/*.ts")

test("shared auth wrappers accept live opaque keys and preserve JWT claims", async () => {
  const t = convexTest(schema, modules)
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error("AUTH_SECRET is required for credential resolution tests")
  const userId = await t.run(async (ctx) => {
    const createdAt = new Date().toISOString()
    return ctx.db.insert("users", { name: "Credential owner", role: "user", createdAt, updatedAt: createdAt })
  })
  const credential = "a".repeat(64)
  const digest = await apiKeyCredentialHash(credential)
  await t.run((ctx) =>
    ctx.db.insert("authApiKeys", {
      userId,
      name: "integration",
      digest,
      previewFirst3: credential.slice(0, 3),
      previewLast3: credential.slice(-3),
      createdAt: new Date().toISOString(),
    }),
  )

  const keyAuth = await t.query(api.auth.apiKeyListQuery, {
    token: credential,
    paginationOpts: { numItems: 10, cursor: null },
  })
  expect(keyAuth.success).toBe(true)
  const resolvedKey = await t.query(internal.auth.apiKeyCredentialResolveQuery, { credential })
  expect(resolvedKey).toEqual({ success: true, data: { kind: "apiKey", userId } })

  const jwt = await tokenCreate(userId, secret)
  const resolvedJwt = await t.query(internal.auth.apiKeyCredentialResolveQuery, { credential: jwt })
  expect(resolvedJwt.success).toBe(true)
  if (resolvedJwt.success) {
    expect(resolvedJwt.data.kind).toBe("jwt")
    if (resolvedJwt.data.kind === "jwt") {
      expect(resolvedJwt.data.decodedToken.sub).toBe(userId)
      expect(resolvedJwt.data.decodedToken.exp).toEqual(expect.any(Number))
      expect(resolvedJwt.data.decodedToken).not.toHaveProperty("apiKey")
    }
  }
})

test("credential resolution rejects missing, malformed, revoked, expired, and deleted-owner keys", async () => {
  const t = convexTest(schema, modules)
  const userIds = await t.run(async (ctx) => {
    const createdAt = new Date().toISOString()
    const active = await ctx.db.insert("users", { name: "Active", role: "user", createdAt, updatedAt: createdAt })
    const deleted = await ctx.db.insert("users", {
      name: "Deleted",
      role: "user",
      createdAt,
      updatedAt: createdAt,
      deletedAt: createdAt,
    })
    return [active, deleted] as const
  })
  const credentials = ["b".repeat(64), "c".repeat(64), "d".repeat(64)] as const
  const digests = await Promise.all(credentials.map(apiKeyCredentialHash))
  await t.run(async (ctx) => {
    const base = { name: "test", previewFirst3: "abc", previewLast3: "xyz", createdAt: new Date().toISOString() }
    await ctx.db.insert("authApiKeys", { ...base, userId: userIds[0], digest: digests[0], revokedAt: base.createdAt })
    await ctx.db.insert("authApiKeys", {
      ...base,
      userId: userIds[0],
      digest: digests[1],
      expiresAt: "2000-01-01T00:00:00.000Z",
    })
    await ctx.db.insert("authApiKeys", { ...base, userId: userIds[1], digest: digests[2] })
  })

  for (const credential of ["", "not-a-key", "e".repeat(64), ...credentials]) {
    const result = await t.query(internal.auth.apiKeyCredentialResolveQuery, { credential })
    expect(result.success).toBe(false)
  }
})

test("org member mutations accept live API keys and reject revoked or expired keys", async () => {
  const t = convexTest(schema, modules)
  const userIds = await t.run(async (ctx) => {
    const createdAt = new Date().toISOString()
    const ownerId = await ctx.db.insert("users", { name: "Org owner", role: "user", createdAt, updatedAt: createdAt })
    const memberId = await ctx.db.insert("users", { name: "Org member", role: "user", createdAt, updatedAt: createdAt })
    const orgId = await ctx.db.insert("orgs", {
      orgHandle: "credential-org",
      name: "Credential org",
      createdAt,
      updatedAt: createdAt,
    })
    return { ownerId, memberId, orgId }
  })
  const live = "f".repeat(64)
  const revoked = "e".repeat(64)
  const expired = "d".repeat(64)
  const digests = await Promise.all([live, revoked, expired].map(apiKeyCredentialHash))
  await t.run(async (ctx) => {
    const createdAt = new Date().toISOString()
    await ctx.db.insert("authApiKeys", {
      userId: userIds.ownerId,
      name: "live",
      digest: digests[0],
      previewFirst3: "fff",
      previewLast3: "fff",
      createdAt,
    })
    await ctx.db.insert("authApiKeys", {
      userId: userIds.ownerId,
      name: "revoked",
      digest: digests[1],
      previewFirst3: "eee",
      previewLast3: "eee",
      createdAt,
      revokedAt: createdAt,
    })
    await ctx.db.insert("authApiKeys", {
      userId: userIds.ownerId,
      name: "expired",
      digest: digests[2],
      previewFirst3: "ddd",
      previewLast3: "ddd",
      createdAt,
      expiresAt: "2000-01-01T00:00:00.000Z",
    })
  })

  const accepted = await t.mutation(api.org.orgMemberCreateMutation, {
    token: live,
    orgHandle: "credential-org",
    userId: userIds.memberId,
    role: "member",
  })
  expect(accepted.success).toBe(true)
  const membership = await t.run((ctx) =>
    ctx.db
      .query("orgMembers")
      .withIndex("userId", (q) => q.eq("userId", userIds.memberId))
      .unique(),
  )
  expect(membership?.invitedBy).toBe(userIds.ownerId)

  for (const credential of [revoked, expired]) {
    const rejected = await t.mutation(api.org.orgMemberCreateMutation, {
      token: credential,
      orgHandle: "credential-org",
      userId: userIds.memberId,
      role: "member",
    })
    expect(rejected.success).toBe(false)
  }
})
