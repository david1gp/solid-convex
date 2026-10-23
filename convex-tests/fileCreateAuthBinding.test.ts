/// <reference types="vite/client" />

import { convexTest } from "convex-test"
import { describe, expect, it } from "vitest"
import { api, internal } from "../convex/_generated/api.js"
import schema from "../convex/schema.js"
import { tokenCreate } from "../src/auth/server/jwt_token/tokenCreate.ts"
import { fileGetByIdFn } from "../src/file/convex/fileGetByIdFn.ts"

const modules = import.meta.glob("../convex/**/*.ts")
const timestamps = { createdAt: "2026-10-14T00:00:00.000Z", updatedAt: "2026-10-14T00:00:00.000Z" }

if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = "b7dc996d90e6155ef59d268e3f169ab6feb34d98f18cba0155e5d075e47ef6b1"
}

describe("File creation auth binding", () => {
  it("binds fileCreateMutation to verified caller session and ignores spoofed client userId", async () => {
    const t = convexTest(schema, modules)
    const secret = process.env.AUTH_SECRET!

    const { userAId, userBId } = await t.run(async (ctx) => {
      const userAId = await ctx.db.insert("users", {
        name: "User Alice",
        username: "alice",
        role: "user",
        ...timestamps,
      })
      const userBId = await ctx.db.insert("users", {
        name: "User Bob",
        username: "bob",
        role: "user",
        ...timestamps,
      })
      return { userAId, userBId }
    })

    const tokenA = await tokenCreate(userAId, secret)

    // User Alice uploads a normal file
    const uploadResult = await t.mutation(api.file.fileCreateMutation, {
      token: tokenA,
      fileId: "2026-10-14_normal-upload-1",
      displayName: "document.pdf",
      contentType: "application/pdf",
      fileSize: 1024,
      url: "https://example.com/document.pdf",
    })
    expect(uploadResult.success).toBe(true)

    const normalDoc = await t.run(async (ctx) =>
      ctx.db
        .query("files")
        .withIndex("fileId", (q) => q.eq("fileId", "2026-10-14_normal-upload-1"))
        .unique(),
    )
    expect(normalDoc).not.toBeNull()
    expect(normalDoc?.userId).toBe(userAId)

    // User Alice attempts to spoof ownership by passing User Bob's ID
    const spoofResult = await t.mutation(api.file.fileCreateMutation, {
      token: tokenA,
      userId: userBId,
      fileId: "2026-10-14_spoofed-attempt-1",
      displayName: "spoofed.pdf",
      contentType: "application/pdf",
      fileSize: 2048,
      url: "https://example.com/spoofed.pdf",
    })
    expect(spoofResult.success).toBe(true)

    const spoofedDoc = await t.run(async (ctx) =>
      ctx.db
        .query("files")
        .withIndex("fileId", (q) => q.eq("fileId", "2026-10-14_spoofed-attempt-1"))
        .unique(),
    )
    expect(spoofedDoc).not.toBeNull()
    // Ownership MUST be bound to authenticated session user (Alice), NOT spoofed user (Bob)
    expect(spoofedDoc?.userId).toBe(userAId)
    expect(spoofedDoc?.userId).not.toBe(userBId)

    // Internal mutation keeps trusted server-provided userId
    const internalResult = await t.mutation(internal.file.fileCreateInternalMutation, {
      userId: userBId,
      fileId: "2026-10-14_internal-server-1",
      displayName: "server.pdf",
      contentType: "application/pdf",
      fileSize: 512,
      url: "https://example.com/server.pdf",
    })
    expect(internalResult.success).toBe(true)

    const internalDoc = await t.run(async (ctx) =>
      ctx.db
        .query("files")
        .withIndex("fileId", (q) => q.eq("fileId", "2026-10-14_internal-server-1"))
        .unique(),
    )
    expect(internalDoc).not.toBeNull()
    expect(internalDoc?.userId).toBe(userBId)
  })

  it("binds r2FileCreateMutation to verified caller session and ignores spoofed client userId", async () => {
    const t = convexTest(schema, modules)
    const secret = process.env.AUTH_SECRET!

    const { userAId, userBId } = await t.run(async (ctx) => {
      const userAId = await ctx.db.insert("users", {
        name: "User Alice",
        username: "alice",
        role: "user",
        ...timestamps,
      })
      const userBId = await ctx.db.insert("users", {
        name: "User Bob",
        username: "bob",
        role: "user",
        ...timestamps,
      })
      return { userAId, userBId }
    })

    const tokenA = await tokenCreate(userAId, secret)

    // User Alice creates an R2 file record with spoofed Bob userId
    const r2Result = await t.mutation(api.r2.r2FileCreateMutation, {
      token: tokenA,
      userId: userBId,
      fileId: "2026-10-14_r2-spoofed-attempt-1",
      displayName: "r2-file.bin",
      contentType: "application/octet-stream",
      fileSize: 4096,
      url: "https://example.com/r2-file.bin",
    })
    expect(r2Result.success).toBe(true)

    const r2Doc = await t.run(async (ctx) =>
      ctx.db
        .query("files")
        .withIndex("fileId", (q) => q.eq("fileId", "2026-10-14_r2-spoofed-attempt-1"))
        .unique(),
    )
    expect(r2Doc).not.toBeNull()
    // Ownership MUST be bound to authenticated session user (Alice), NOT spoofed user (Bob)
    expect(r2Doc?.userId).toBe(userAId)
    expect(r2Doc?.userId).not.toBe(userBId)

    // Internal mutation keeps trusted server-provided userId
    const internalR2Result = await t.mutation(internal.r2.r2FileCreateInternalMutation, {
      userId: userBId,
      fileId: "2026-10-14_r2-internal-1",
      displayName: "r2-server.bin",
      contentType: "application/octet-stream",
      fileSize: 512,
      url: "https://example.com/r2-server.bin",
    })
    expect(internalR2Result.success).toBe(true)

    const internalDoc = await t.run(async (ctx) =>
      ctx.db
        .query("files")
        .withIndex("fileId", (q) => q.eq("fileId", "2026-10-14_r2-internal-1"))
        .unique(),
    )
    expect(internalDoc).not.toBeNull()
    expect(internalDoc?.userId).toBe(userBId)
  })

  it("idempotently handles identical upload retries without duplicate file rows or joins and rejects conflicting owners or metadata", async () => {
    const t = convexTest(schema, modules)
    const secret = process.env.AUTH_SECRET!

    const { userAId, userBId } = await t.run(async (ctx) => {
      const userAId = await ctx.db.insert("users", {
        name: "User Alice",
        username: "alice",
        role: "user",
        ...timestamps,
      })
      const userBId = await ctx.db.insert("users", {
        name: "User Bob",
        username: "bob",
        role: "user",
        ...timestamps,
      })
      await ctx.db.insert("resources", {
        resourceId: "2026-10-14_shared-resource-1",
        name: "Shared Resource",
        type: "other",
        visibility: "public",
        ...timestamps,
      })
      return { userAId, userBId }
    })

    const tokenA = await tokenCreate(userAId, secret)
    const tokenB = await tokenCreate(userBId, secret)

    const uploadPayload = {
      token: tokenA,
      fileId: "2026-10-14_idempotent-retry-file",
      displayName: "invoice.pdf",
      contentType: "application/pdf",
      fileSize: 2048,
      url: "https://example.com/invoice.pdf",
      resourceId: "2026-10-14_shared-resource-1",
    }

    // First invocation inserts the file row and join link
    const firstResult = await t.mutation(api.file.fileCreateMutation, uploadPayload)
    expect(firstResult.success).toBe(true)
    if (!firstResult.success) throw new Error("First upload failed")
    const existingFileId = firstResult.data

    // Second invocation with identical parameters returns existing ID idempotently
    const retryResult = await t.mutation(api.file.fileCreateMutation, uploadPayload)
    expect(retryResult.success).toBe(true)
    if (!retryResult.success) throw new Error("Retry upload failed")
    expect(retryResult.data).toBe(existingFileId)

    // Exactly one file row and one join link exist, fileGetByIdFn does not throw
    const fileDocs = await t.run(async (ctx) =>
      ctx.db
        .query("files")
        .withIndex("fileId", (q) => q.eq("fileId", "2026-10-14_idempotent-retry-file"))
        .collect(),
    )
    expect(fileDocs).toHaveLength(1)
    expect(fileDocs[0]?._id).toBe(existingFileId)

    const joinDocs = await t.run(async (ctx) =>
      ctx.db
        .query("resourceFiles")
        .withIndex("resourceIdFileId", (q) =>
          q.eq("resourceId", "2026-10-14_shared-resource-1").eq("fileId", "2026-10-14_idempotent-retry-file"),
        )
        .collect(),
    )
    expect(joinDocs).toHaveLength(1)

    const getByIdResult = await t.run(async (ctx) => fileGetByIdFn(ctx, "2026-10-14_idempotent-retry-file"))
    expect(getByIdResult?._id).toBe(existingFileId)

    // Different owner attempting to create with same fileId is rejected with conflict
    const otherOwnerResult = await t.mutation(api.file.fileCreateMutation, {
      ...uploadPayload,
      token: tokenB,
    })
    expect(otherOwnerResult.success).toBe(false)
    if (!otherOwnerResult.success) {
      expect(otherOwnerResult.errorMessage).toMatch(/conflict|owner/i)
    }

    // Conflicting metadata on retry by same owner is rejected and does not mutate existing doc
    const conflictMetaResult = await t.mutation(api.file.fileCreateMutation, {
      ...uploadPayload,
      fileSize: 4096,
    })
    expect(conflictMetaResult.success).toBe(false)
    if (!conflictMetaResult.success) {
      expect(conflictMetaResult.errorMessage).toMatch(/conflict|metadata/i)
    }

    // Conflicting assignment on retry by same owner is rejected and does not add new join
    const conflictAssignResult = await t.mutation(api.file.fileCreateMutation, {
      ...uploadPayload,
      resourceId: undefined,
    })
    expect(conflictAssignResult.success).toBe(false)
    if (!conflictAssignResult.success) {
      expect(conflictAssignResult.errorMessage).toMatch(/conflict|assignment/i)
    }
  })
})
