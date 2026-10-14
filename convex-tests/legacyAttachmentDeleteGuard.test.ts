/// <reference types="vite/client" />

import { convexTest } from "convex-test"
import { describe, expect, it } from "vitest"
import { api, internal } from "../convex/_generated/api.js"
import schema from "../convex/schema.js"
import { apiKeyCredentialHash } from "../src/auth/model/apiKeyCredentialHash.ts"

const modules = import.meta.glob("../convex/**/*.ts")
const timestamps = { createdAt: "2026-10-14T00:00:00.000Z", updatedAt: "2026-10-14T00:00:00.000Z" }

async function setupFixture() {
  const t = convexTest(schema, modules)
  const token = "a".repeat(64)
  const digest = await apiKeyCredentialHash(token)

  const data = await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", { name: "Test User", role: "user", ...timestamps })
    await ctx.db.insert("authApiKeys", {
      userId,
      name: "Test Key",
      digest,
      previewFirst3: token.slice(0, 3),
      previewLast3: token.slice(-3),
      createdAt: timestamps.createdAt,
    })

    // Subtree A (will be locked for deletion)
    const orgAId = await ctx.db.insert("orgs", { orgHandle: "org-a", name: "Org A", ...timestamps })
    const teamAId = await ctx.db.insert("teams", { orgId: orgAId, name: "Team A", ...timestamps })
    const projAId = await ctx.db.insert("projects", {
      orgId: orgAId,
      teamId: teamAId,
      name: "Project A",
      ...timestamps,
    })

    // Subtree B (healthy, non-deleting)
    const orgBId = await ctx.db.insert("orgs", { orgHandle: "org-b", name: "Org B", ...timestamps })
    const teamBId = await ctx.db.insert("teams", { orgId: orgBId, name: "Team B", ...timestamps })
    const projBId = await ctx.db.insert("projects", {
      orgId: orgBId,
      teamId: teamBId,
      name: "Project B",
      ...timestamps,
    })

    // Resources in Subtree A
    const resAProject = "res-a-proj-999001"
    await ctx.db.insert("resources", {
      resourceId: resAProject,
      name: "Resource A Assigned",
      assignment: { kind: "project", id: projAId },
      orgId: orgAId,
      teamId: teamAId,
      projectId: projAId,
      ...timestamps,
    })

    const resALegacy = "res-a-leg-999002"
    await ctx.db.insert("resources", {
      resourceId: resALegacy,
      name: "Resource A Legacy",
      ...timestamps,
    })
    await ctx.db.insert("orgResources", {
      orgId: orgAId,
      orgHandle: "org-a",
      resourceId: resALegacy,
      createdAt: timestamps.createdAt,
    })

    // Resources in Subtree B
    const resB = "res-b-proj-999003"
    await ctx.db.insert("resources", {
      resourceId: resB,
      name: "Resource B",
      assignment: { kind: "project", id: projBId },
      orgId: orgBId,
      teamId: teamBId,
      projectId: projBId,
      ...timestamps,
    })

    // Unassigned Resource
    const resUnassigned = "res-unassigned-999004"
    await ctx.db.insert("resources", {
      resourceId: resUnassigned,
      name: "Resource Unassigned",
      ...timestamps,
    })

    // Files in Subtree A
    const fileA = "2026-10-14_file-a-in-subtree"
    await ctx.db.insert("files", {
      fileId: fileA,
      userId,
      assignment: { kind: "project", id: projAId },
      orgId: orgAId,
      teamId: teamAId,
      projectId: projAId,
      displayName: "file-a.pdf",
      fileSize: 100,
      contentType: "application/pdf",
      url: "https://example.com/file-a.pdf",
      ...timestamps,
    })

    // Files in Subtree B
    const fileB = "2026-10-14_file-b-in-subtree"
    await ctx.db.insert("files", {
      fileId: fileB,
      userId,
      assignment: { kind: "project", id: projBId },
      orgId: orgBId,
      teamId: teamBId,
      projectId: projBId,
      displayName: "file-b.pdf",
      fileSize: 200,
      contentType: "application/pdf",
      url: "https://example.com/file-b.pdf",
      ...timestamps,
    })

    // Unassigned File
    const fileUnassigned = "2026-10-14_file-unassigned"
    await ctx.db.insert("files", {
      fileId: fileUnassigned,
      userId,
      displayName: "file-unassigned.pdf",
      fileSize: 300,
      contentType: "application/pdf",
      url: "https://example.com/file-unassigned.pdf",
      ...timestamps,
    })

    return {
      userId,
      orgAId,
      orgBId,
      teamAId,
      teamBId,
      projAId,
      projBId,
      resAProject,
      resALegacy,
      resB,
      resUnassigned,
      fileA,
      fileB,
      fileUnassigned,
    }
  })

  return { t, token, ...data }
}

describe("Legacy attachment mutation deletion guards", () => {
  it("legacy orgResourceAdd rejects deleting org and deleting resource ancestry, while healthy subtree succeeds with doc consistency", async () => {
    const { t, token, orgAId, orgBId, resAProject, resALegacy, resUnassigned } = await setupFixture()

    // Confirm deletion lock on Org A
    const preview = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "org",
      orgId: orgAId,
    })
    expect(preview.success).toBe(true)
    if (!preview.success) throw new Error("Preview failed")

    const confirm = await t.mutation(api.hierarchyDelete.hierarchyDeleteConfirmMutation, {
      token,
      kind: "org",
      orgId: orgAId,
      fingerprint: preview.data.fingerprint,
    })
    expect(confirm.success).toBe(true)

    // 1. Rejects attaching an unassigned resource to deleting Org A
    const attachToDeletingOrg = await t.mutation(api.org.orgResourceAddMutation, {
      token,
      orgHandle: "org-a",
      orgId: orgAId,
      resourceId: resUnassigned,
    })
    expect(attachToDeletingOrg.success).toBe(false)
    if (attachToDeletingOrg.success) throw new Error("Expected attach to deleting org to fail")
    expect(attachToDeletingOrg.errorMessage).toMatch(/delet/i)

    // 2. Rejects attaching a resource with deleting project ancestry to healthy Org B
    const attachDeletingAncestryRes = await t.mutation(api.org.orgResourceAddMutation, {
      token,
      orgHandle: "org-b",
      orgId: orgBId,
      resourceId: resAProject,
    })
    expect(attachDeletingAncestryRes.success).toBe(false)
    if (attachDeletingAncestryRes.success) throw new Error("Expected attach with deleting ancestry to fail")
    expect(attachDeletingAncestryRes.errorMessage).toMatch(/delet/i)

    // 3. Rejects attaching legacy-only resource of deleting Org A to healthy Org B
    const attachDeletingLegacyRes = await t.mutation(internal.org.orgResourceAddInternalMutation, {
      orgHandle: "org-b",
      orgId: orgBId,
      resourceId: resALegacy,
    })
    expect(attachDeletingLegacyRes.success).toBe(false)
    if (attachDeletingLegacyRes.success) throw new Error("Expected attach legacy deleting resource to fail")
    expect(attachDeletingLegacyRes.errorMessage).toMatch(/delet/i)

    // 4. Healthy subtree succeeds: attach unassigned resource to healthy Org B
    const attachHealthyRes = await t.mutation(api.org.orgResourceAddMutation, {
      token,
      orgHandle: "org-b",
      orgId: orgBId,
      resourceId: resUnassigned,
    })
    expect(attachHealthyRes.success).toBe(true)

    // Verify consistency: resource doc in resources table is updated with orgId and assignment
    const resourceDoc = await t.run(async (ctx) =>
      ctx.db
        .query("resources")
        .withIndex("resourceId", (q) => q.eq("resourceId", resUnassigned))
        .unique(),
    )
    expect(resourceDoc?.orgId).toBe(orgBId)
    expect(resourceDoc?.assignment).toEqual({ kind: "organization", id: orgBId })

    // Verify orgResources row exists
    const orgResRow = await t.run(async (ctx) =>
      ctx.db
        .query("orgResources")
        .withIndex("orgHandleResourceId", (q) => q.eq("orgHandle", "org-b").eq("resourceId", resUnassigned))
        .first(),
    )
    expect(orgResRow).not.toBeNull()
  })

  it("legacy resourceFileAdd rejects deleting resource and deleting file ancestry, while healthy subtree succeeds with files.resourceId consistency", async () => {
    const { t, token, orgAId, resAProject, resALegacy, resB, fileA, fileUnassigned } = await setupFixture()

    // Confirm deletion lock on Org A
    const preview = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "org",
      orgId: orgAId,
    })
    expect(preview.success).toBe(true)
    if (!preview.success) throw new Error("Preview failed")

    const confirm = await t.mutation(api.hierarchyDelete.hierarchyDeleteConfirmMutation, {
      token,
      kind: "org",
      orgId: orgAId,
      fingerprint: preview.data.fingerprint,
    })
    expect(confirm.success).toBe(true)

    // 1. Rejects attaching an unassigned file to resource in deleting subtree (resAProject)
    const attachFileToDeletingRes = await t.mutation(api.resource.resourceFileAddMutation, {
      token,
      resourceId: resAProject,
      fileId: fileUnassigned,
    })
    expect(attachFileToDeletingRes.success).toBe(false)
    if (attachFileToDeletingRes.success) throw new Error("Expected attach to deleting resource to fail")
    expect(attachFileToDeletingRes.errorMessage).toMatch(/delet/i)

    // 2. Rejects attaching an unassigned file to legacy resource of deleting Org A (resALegacy)
    const attachFileToDeletingLegacyRes = await t.mutation(internal.resource.resourceFileAddInternalMutation, {
      resourceId: resALegacy,
      fileId: fileUnassigned,
    })
    expect(attachFileToDeletingLegacyRes.success).toBe(false)
    if (attachFileToDeletingLegacyRes.success) throw new Error("Expected attach to deleting legacy resource to fail")
    expect(attachFileToDeletingLegacyRes.errorMessage).toMatch(/delet/i)

    // 3. Rejects attaching a file in deleting subtree (fileA) to healthy resource (resB)
    const attachDeletingFileToHealthyRes = await t.mutation(api.resource.resourceFileAddMutation, {
      token,
      resourceId: resB,
      fileId: fileA,
    })
    expect(attachDeletingFileToHealthyRes.success).toBe(false)
    if (attachDeletingFileToHealthyRes.success) throw new Error("Expected attach of deleting file to fail")
    expect(attachDeletingFileToHealthyRes.errorMessage).toMatch(/delet/i)

    // 4. Healthy subtree succeeds: attach unassigned file to healthy resource (resB)
    const attachHealthyFile = await t.mutation(api.resource.resourceFileAddMutation, {
      token,
      resourceId: resB,
      fileId: fileUnassigned,
    })
    expect(attachHealthyFile.success).toBe(true)

    // Verify consistency: files row has resourceId updated
    const fileDoc = await t.run(async (ctx) =>
      ctx.db
        .query("files")
        .withIndex("fileId", (q) => q.eq("fileId", fileUnassigned))
        .unique(),
    )
    expect(fileDoc?.resourceId).toBe(resB)

    // Verify resourceFiles join row exists
    const joinRow = await t.run(async (ctx) =>
      ctx.db
        .query("resourceFiles")
        .withIndex("resourceIdFileId", (q) => q.eq("resourceId", resB).eq("fileId", fileUnassigned))
        .first(),
    )
    expect(joinRow).not.toBeNull()
  })

  it("legacy orgResourceAdd preserves canonical deeper assignment on same-org add and rejects different-org add", async () => {
    const { t, token, orgBId, projBId, teamBId, resB } = await setupFixture()

    // Create a separate healthy organization Org C
    const orgCId = await t.run(async (ctx) =>
      ctx.db.insert("orgs", { orgHandle: "org-c", name: "Org C", ...timestamps }),
    )

    // 1. Rejects attaching resB (assigned to Org B project) to Org C
    const attachToDifferentOrg = await t.mutation(api.org.orgResourceAddMutation, {
      token,
      orgHandle: "org-c",
      orgId: orgCId,
      resourceId: resB,
    })
    expect(attachToDifferentOrg.success).toBe(false)
    if (attachToDifferentOrg.success) throw new Error("Expected attach to different org to fail")
    expect(attachToDifferentOrg.errorMessage).toMatch(/different organization/i)

    // 2. Attaching resB to Org B (same org) succeeds and PRESERVES canonical deeper project assignment
    const attachToSameOrg = await t.mutation(api.org.orgResourceAddMutation, {
      token,
      orgHandle: "org-b",
      orgId: orgBId,
      resourceId: resB,
    })
    expect(attachToSameOrg.success).toBe(true)

    // Verify canonical project assignment and derived fields are intact
    const resourceDoc = await t.run(async (ctx) =>
      ctx.db
        .query("resources")
        .withIndex("resourceId", (q) => q.eq("resourceId", resB))
        .unique(),
    )
    expect(resourceDoc?.assignment).toEqual({ kind: "project", id: projBId })
    expect(resourceDoc?.orgId).toBe(orgBId)
    expect(resourceDoc?.teamId).toBe(teamBId)
    expect(resourceDoc?.projectId).toBe(projBId)
    expect(resourceDoc?.noteId).toBeUndefined()

    // Verify orgResources row exists for (org-b, resB)
    const orgResRow = await t.run(async (ctx) =>
      ctx.db
        .query("orgResources")
        .withIndex("orgHandleResourceId", (q) => q.eq("orgHandle", "org-b").eq("resourceId", resB))
        .first(),
    )
    expect(orgResRow).not.toBeNull()
  })

  it("legacy resourceFileAdd rejects attaching file when already attached to a different resource", async () => {
    const { t, token, orgBId, resB, fileUnassigned } = await setupFixture()

    // Create a second healthy resource in Subtree B
    const resB2 = "res-b2-healthy-999005"
    await t.run(async (ctx) =>
      ctx.db.insert("resources", {
        resourceId: resB2,
        name: "Resource B2",
        assignment: { kind: "organization", id: orgBId },
        orgId: orgBId,
        ...timestamps,
      }),
    )

    // 1. Attach unassigned file to resB
    const attachFirst = await t.mutation(api.resource.resourceFileAddMutation, {
      token,
      resourceId: resB,
      fileId: fileUnassigned,
    })
    expect(attachFirst.success).toBe(true)

    // 2. Idempotent re-attach to the same resource succeeds
    const attachSameAgain = await t.mutation(api.resource.resourceFileAddMutation, {
      token,
      resourceId: resB,
      fileId: fileUnassigned,
    })
    expect(attachSameAgain.success).toBe(true)

    // 3. Attaching already-attached file to a different resource (resB2) is rejected
    const attachDifferentRes = await t.mutation(api.resource.resourceFileAddMutation, {
      token,
      resourceId: resB2,
      fileId: fileUnassigned,
    })
    expect(attachDifferentRes.success).toBe(false)
    if (attachDifferentRes.success) throw new Error("Expected attach to different resource to fail")
    expect(attachDifferentRes.errorMessage).toMatch(/already attached to a different resource/i)

    // Verify file doc canonical resourceId remains resB
    const fileDoc = await t.run(async (ctx) =>
      ctx.db
        .query("files")
        .withIndex("fileId", (q) => q.eq("fileId", fileUnassigned))
        .unique(),
    )
    expect(fileDoc?.resourceId).toBe(resB)

    // Verify no conflicting link exists in resourceFiles for resB2
    const conflictingLink = await t.run(async (ctx) =>
      ctx.db
        .query("resourceFiles")
        .withIndex("resourceIdFileId", (q) => q.eq("resourceId", resB2).eq("fileId", fileUnassigned))
        .first(),
    )
    expect(conflictingLink).toBeNull()
  })
})
