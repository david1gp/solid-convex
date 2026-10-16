/// <reference types="vite/client" />

import { convexTest } from "convex-test"
import { describe, expect, it, vi } from "vitest"
import { api, internal } from "../convex/_generated/api.js"
import schema from "../convex/schema.js"
import { r2FileCreateHttpHandler } from "../src/r2/convex/r2FileCreateHttpHandler.ts"

const modules = import.meta.glob("../convex/**/*.ts")
const timestamps = { createdAt: "2026-10-14T00:00:00.000Z", updatedAt: "2026-10-14T00:00:00.000Z" }

async function setupHierarchyFixture() {
  const t = convexTest(schema, modules)
  const data = await t.run(async (ctx) => {
    const orgId = await ctx.db.insert("orgs", { orgHandle: "acme-corp", ...timestamps })
    const otherOrgId = await ctx.db.insert("orgs", { orgHandle: "other-corp", ...timestamps })

    const teamId = await ctx.db.insert("teams", { orgId, name: "Engineering", ...timestamps })
    const otherTeamId = await ctx.db.insert("teams", { orgId: otherOrgId, name: "Marketing", ...timestamps })

    const projectId = await ctx.db.insert("projects", {
      orgId,
      teamId,
      name: "Platform",
      ...timestamps,
    })
    const otherProjectId = await ctx.db.insert("projects", {
      orgId: otherOrgId,
      teamId: otherTeamId,
      name: "Campaign",
      ...timestamps,
    })

    const noteId = await ctx.db.insert("notes", {
      orgId,
      teamId,
      projectId,
      title: "Architecture Spec",
      content: "# Architecture Spec",
      ...timestamps,
    })

    const userId = await ctx.db.insert("users", {
      name: "Dev User",
      role: "user",
      ...timestamps,
    })

    return { orgId, otherOrgId, teamId, otherTeamId, projectId, otherProjectId, noteId, userId }
  })
  return { t, ...data }
}

describe("Mutation assignment hooks", () => {
  it("resource create derives canonical ancestor IDs and rejects mismatched chains", async () => {
    const { t, orgId, teamId, projectId, otherOrgId } = await setupHierarchyFixture()

    // 1. Valid assignment at project level without supplying orgId/teamId -> derived automatically
    const createResult = await t.mutation(internal.resource.resourceCreateInternalMutation, {
      resourceId: "res-canonical-1",
      name: "Resource 1",
      assignment: { kind: "project", id: projectId },
    })
    expect(createResult.success).toBe(true)

    const saved = await t.run(async (ctx) =>
      ctx.db
        .query("resources")
        .withIndex("resourceId", (q) => q.eq("resourceId", "res-canonical-1"))
        .unique(),
    )
    expect(saved).toMatchObject({
      resourceId: "res-canonical-1",
      assignment: { kind: "project", id: projectId },
      orgId,
      teamId,
      projectId,
    })

    // 2. Reject mismatched chain (e.g. project with wrong orgId)
    const mismatchedResult = await t.mutation(internal.resource.resourceCreateInternalMutation, {
      resourceId: "res-mismatched-1",
      name: "Mismatched Resource",
      assignment: { kind: "project", id: projectId },
      orgId: otherOrgId,
    })
    expect(mismatchedResult.success).toBe(false)
  })

  it("resource edit preserves omitted assignment and supports explicit clearing", async () => {
    const { t, orgId, teamId, projectId } = await setupHierarchyFixture()

    // Create resource with project assignment
    await t.mutation(internal.resource.resourceCreateInternalMutation, {
      resourceId: "res-preserve-test",
      name: "Initial Name",
      assignment: { kind: "project", id: projectId },
    })

    // Edit without assignment -> preserves existing assignment
    const editOmitted = await t.mutation(internal.resource.resourceEditInternalMutation, {
      resourceId: "res-preserve-test",
      name: "Updated Name",
    })
    expect(editOmitted.success).toBe(true)

    const preserved = await t.run(async (ctx) =>
      ctx.db
        .query("resources")
        .withIndex("resourceId", (q) => q.eq("resourceId", "res-preserve-test"))
        .unique(),
    )
    expect(preserved?.name).toBe("Updated Name")
    expect(preserved?.assignment).toEqual({ kind: "project", id: projectId })
    expect(preserved?.orgId).toBe(orgId)
    expect(preserved?.teamId).toBe(teamId)
    expect(preserved?.projectId).toBe(projectId)

    // Edit with explicit clearing (assignment: null)
    const editCleared = await t.mutation(internal.resource.resourceEditInternalMutation, {
      resourceId: "res-preserve-test",
      assignment: null,
    })
    expect(editCleared.success).toBe(true)

    const cleared = await t.run(async (ctx) =>
      ctx.db
        .query("resources")
        .withIndex("resourceId", (q) => q.eq("resourceId", "res-preserve-test"))
        .unique(),
    )
    expect(cleared?.assignment).toBeUndefined()
    expect(cleared?.orgId).toBeUndefined()
    expect(cleared?.teamId).toBeUndefined()
    expect(cleared?.projectId).toBeUndefined()
    expect(cleared?.noteId).toBeUndefined()
  })

  it("synchronizes legacy orgResources with new assignment org and removes conflicting orgs", async () => {
    const { t, orgId, otherOrgId } = await setupHierarchyFixture()

    // 1. Create resource assigned to orgId -> orgResources row is created
    await t.mutation(internal.resource.resourceCreateInternalMutation, {
      resourceId: "res-org-sync-test",
      name: "Org Sync Test",
      assignment: { kind: "organization", id: orgId },
    })

    const orgResourcesFirst = await t.run(async (ctx) =>
      ctx.db
        .query("orgResources")
        .withIndex("resourceId", (q) => q.eq("resourceId", "res-org-sync-test"))
        .collect(),
    )
    expect(orgResourcesFirst).toHaveLength(1)
    expect(orgResourcesFirst[0]?.orgId).toBe(orgId)

    // 2. Reassign to otherOrgId -> orgResources synchronized, previous org entry removed
    await t.mutation(internal.resource.resourceEditInternalMutation, {
      resourceId: "res-org-sync-test",
      assignment: { kind: "organization", id: otherOrgId },
    })

    const orgResourcesSecond = await t.run(async (ctx) =>
      ctx.db
        .query("orgResources")
        .withIndex("resourceId", (q) => q.eq("resourceId", "res-org-sync-test"))
        .collect(),
    )
    expect(orgResourcesSecond).toHaveLength(1)
    expect(orgResourcesSecond[0]?.orgId).toBe(otherOrgId)

    // 3. Clear assignment -> orgResources cleared
    await t.mutation(internal.resource.resourceEditInternalMutation, {
      resourceId: "res-org-sync-test",
      assignment: null,
    })

    const orgResourcesThird = await t.run(async (ctx) =>
      ctx.db
        .query("orgResources")
        .withIndex("resourceId", (q) => q.eq("resourceId", "res-org-sync-test"))
        .collect(),
    )
    expect(orgResourcesThird).toHaveLength(0)
  })

  it("file create inherits resource assignment when unassigned, and persists resourceFiles membership", async () => {
    const { t, orgId, teamId, projectId, otherProjectId, userId } = await setupHierarchyFixture()

    // Create a resource assigned to a project
    await t.mutation(internal.resource.resourceCreateInternalMutation, {
      resourceId: "2026-10-14_res-parent-proj",
      name: "Parent Resource",
      assignment: { kind: "project", id: projectId },
    })

    // 1. File created with resourceId and NO explicit assignment -> inherits resource assignment
    const file1Result = await t.mutation(internal.file.fileCreateInternalMutation, {
      userId,
      fileId: "2026-10-14_file-inherited-1",
      displayName: "doc1.pdf",
      url: "https://example.com/doc1.pdf",
      contentType: "application/pdf",
      fileSize: 500,
      resourceId: "2026-10-14_res-parent-proj",
    })
    expect(file1Result.success).toBe(true)

    const file1Doc = await t.run(async (ctx) =>
      ctx.db
        .query("files")
        .withIndex("fileId", (q) => q.eq("fileId", "2026-10-14_file-inherited-1"))
        .unique(),
    )
    expect(file1Doc).toMatchObject({
      fileId: "2026-10-14_file-inherited-1",
      resourceId: "2026-10-14_res-parent-proj",
      assignment: { kind: "project", id: projectId },
      orgId,
      teamId,
      projectId,
    })

    // resourceFiles membership persisted
    const link1 = await t.run(async (ctx) =>
      ctx.db
        .query("resourceFiles")
        .withIndex("resourceIdFileId", (q) =>
          q.eq("resourceId", "2026-10-14_res-parent-proj").eq("fileId", "2026-10-14_file-inherited-1"),
        )
        .first(),
    )
    expect(link1).not.toBeNull()

    // 2. File created with resourceId AND explicit valid assignment -> uses explicit assignment
    const file2Result = await t.mutation(internal.file.fileCreateInternalMutation, {
      userId,
      fileId: "2026-10-14_file-explicit-1",
      displayName: "doc2.pdf",
      url: "https://example.com/doc2.pdf",
      contentType: "application/pdf",
      fileSize: 600,
      resourceId: "2026-10-14_res-parent-proj",
      assignment: { kind: "project", id: otherProjectId },
    })
    expect(file2Result.success).toBe(true)

    const file2Doc = await t.run(async (ctx) =>
      ctx.db
        .query("files")
        .withIndex("fileId", (q) => q.eq("fileId", "2026-10-14_file-explicit-1"))
        .unique(),
    )
    expect(file2Doc?.assignment).toEqual({ kind: "project", id: otherProjectId })
    expect(file2Doc?.resourceId).toBe("2026-10-14_res-parent-proj")

    // resourceFiles membership persisted
    const link2 = await t.run(async (ctx) =>
      ctx.db
        .query("resourceFiles")
        .withIndex("resourceIdFileId", (q) =>
          q.eq("resourceId", "2026-10-14_res-parent-proj").eq("fileId", "2026-10-14_file-explicit-1"),
        )
        .first(),
    )
    expect(link2).not.toBeNull()
  })

  it("file edit preserves omitted assignment, supports clearing, and updates resource linkage", async () => {
    const { t, projectId, userId } = await setupHierarchyFixture()

    await t.mutation(internal.resource.resourceCreateInternalMutation, {
      resourceId: "2026-10-14_res-for-file-edit",
      name: "Resource For File Edit",
      assignment: { kind: "project", id: projectId },
    })

    await t.mutation(internal.file.fileCreateInternalMutation, {
      userId,
      fileId: "2026-10-14_file-edit-test-1",
      displayName: "file1.png",
      url: "https://example.com/file1.png",
      contentType: "image/png",
      fileSize: 100,
      resourceId: "2026-10-14_res-for-file-edit",
    })

    // Edit displayName only -> preserves assignment & resourceId
    const edit1 = await t.mutation(internal.file.fileEditInternalMutation, {
      fileId: "2026-10-14_file-edit-test-1",
      displayName: "file1-renamed.png",
    })
    expect(edit1.success).toBe(true)

    const fileDoc1 = await t.run(async (ctx) =>
      ctx.db
        .query("files")
        .withIndex("fileId", (q) => q.eq("fileId", "2026-10-14_file-edit-test-1"))
        .unique(),
    )
    expect(fileDoc1?.displayName).toBe("file1-renamed.png")
    expect(fileDoc1?.assignment).toEqual({ kind: "project", id: projectId })
    expect(fileDoc1?.resourceId).toBe("2026-10-14_res-for-file-edit")

    // Edit with assignment: null -> clears assignment
    const edit2 = await t.mutation(internal.file.fileEditInternalMutation, {
      fileId: "2026-10-14_file-edit-test-1",
      assignment: null,
    })
    expect(edit2.success).toBe(true)

    const fileDoc2 = await t.run(async (ctx) =>
      ctx.db
        .query("files")
        .withIndex("fileId", (q) => q.eq("fileId", "2026-10-14_file-edit-test-1"))
        .unique(),
    )
    expect(fileDoc2?.assignment).toBeUndefined()
    expect(fileDoc2?.resourceId).toBe("2026-10-14_res-for-file-edit")

    // Edit with resourceId: null -> unlinks from resource
    const edit3 = await t.mutation(internal.file.fileEditInternalMutation, {
      fileId: "2026-10-14_file-edit-test-1",
      resourceId: null,
    })
    expect(edit3.success).toBe(true)

    const fileDoc3 = await t.run(async (ctx) =>
      ctx.db
        .query("files")
        .withIndex("fileId", (q) => q.eq("fileId", "2026-10-14_file-edit-test-1"))
        .unique(),
    )
    expect(fileDoc3?.resourceId).toBeUndefined()

    const oldLink = await t.run(async (ctx) =>
      ctx.db
        .query("resourceFiles")
        .withIndex("resourceIdFileId", (q) =>
          q.eq("resourceId", "2026-10-14_res-for-file-edit").eq("fileId", "2026-10-14_file-edit-test-1"),
        )
        .first(),
    )
    expect(oldLink).toBeNull()
  })

  it("r2 file creation mutations delegate cleanly to fileCreateFn", async () => {
    const { t, projectId, userId } = await setupHierarchyFixture()

    await t.mutation(internal.resource.resourceCreateInternalMutation, {
      resourceId: "2026-10-14_res-r2-test-valid",
      name: "R2 Resource",
      assignment: { kind: "project", id: projectId },
    })

    const r2Result = await t.mutation(internal.r2.r2FileCreateInternalMutation, {
      userId,
      fileId: "2026-10-14_file-r2-inherited",
      displayName: "upload.dat",
      url: "https://r2.test/upload.dat",
      contentType: "application/octet-stream",
      fileSize: 42,
      resourceId: "2026-10-14_res-r2-test-valid",
    })
    expect(r2Result.success).toBe(true)

    const fileDoc = await t.run(async (ctx) =>
      ctx.db
        .query("files")
        .withIndex("fileId", (q) => q.eq("fileId", "2026-10-14_file-r2-inherited"))
        .unique(),
    )
    expect(fileDoc?.assignment).toEqual({ kind: "project", id: projectId })
    expect(fileDoc?.resourceId).toBe("2026-10-14_res-r2-test-valid")
  })

  it("r2FileCreateHttpHandler handles assignment resolution and returns appropriate status", async () => {
    const { t, projectId, otherOrgId, userId } = await setupHierarchyFixture()

    // Mock ActionCtx running mutations against t
    const runQuery = vi.fn(async (_ref: any, args: any) => {
      if (args.credential) return { success: true, data: { userId, type: "apiKey" } }
      if (args.userId) return { _id: userId, username: "dev" }
      return null
    })
    const runMutation = vi.fn(async (mutationRef: any, args: any) => {
      return t.mutation(mutationRef, args)
    })
    const actionCtx = { runQuery, runMutation } as unknown as any

    const token = "mock-token-for-r2-http"

    // Valid file creation with project assignment
    const validReq = new Request("https://example.com/fileCreate", {
      method: "POST",
      headers: {
        authorization: token,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        fileId: "2026-10-14_http-file-valid",
        url: "https://r2.test/valid.pdf",
        displayName: "valid.pdf",
        fileSize: 100,
        contentType: "application/pdf",
        assignment: { kind: "project", id: projectId },
      }),
    })

    const validRes = await r2FileCreateHttpHandler(actionCtx, validReq)
    expect(validRes.status).toBe(200)

    const createdDoc = await t.run(async (ctx) =>
      ctx.db
        .query("files")
        .withIndex("fileId", (q) => q.eq("fileId", "2026-10-14_http-file-valid"))
        .unique(),
    )
    expect(createdDoc?.assignment).toEqual({ kind: "project", id: projectId })

    // Mismatched chain -> rejected with 400
    const invalidReq = new Request("https://example.com/fileCreate", {
      method: "POST",
      headers: {
        authorization: token,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        fileId: "2026-10-14_http-file-invalid",
        url: "https://r2.test/invalid.pdf",
        displayName: "invalid.pdf",
        fileSize: 100,
        contentType: "application/pdf",
        assignment: { kind: "project", id: projectId },
        orgId: otherOrgId,
      }),
    })

    const invalidRes = await r2FileCreateHttpHandler(actionCtx, invalidReq)
    expect(invalidRes.status).toBe(400)
  })
})
