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
  const token = "b".repeat(64)
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

    // Subtree A (will be locked/deleted)
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
    const resAProject = "res-a-proj-000001"
    await ctx.db.insert("resources", {
      resourceId: resAProject,
      name: "Resource A (Project Assigned)",
      assignment: { kind: "project", id: projAId },
      orgId: orgAId,
      teamId: teamAId,
      projectId: projAId,
      ...timestamps,
    })

    const resALegacy = "res-a-leg-0000001"
    await ctx.db.insert("resources", {
      resourceId: resALegacy,
      name: "Resource A (Legacy Org Only)",
      ...timestamps,
    })
    await ctx.db.insert("orgResources", {
      orgId: orgAId,
      orgHandle: "org-a",
      resourceId: resALegacy,
      createdAt: timestamps.createdAt,
    })

    // Resources in Subtree B
    const resB = "res-b-proj-000001"
    await ctx.db.insert("resources", {
      resourceId: resB,
      name: "Resource B",
      assignment: { kind: "project", id: projBId },
      orgId: orgBId,
      teamId: teamBId,
      projectId: projBId,
      ...timestamps,
    })

    // Files in Subtree A
    const fileAAssigned = "2026-10-14_file-a-assigned"
    await ctx.db.insert("files", {
      fileId: fileAAssigned,
      userId,
      assignment: { kind: "project", id: projAId },
      orgId: orgAId,
      teamId: teamAId,
      projectId: projAId,
      displayName: "file-a-assigned.pdf",
      fileSize: 100,
      contentType: "application/pdf",
      url: "https://example.com/file-a-assigned.pdf",
      ...timestamps,
    })

    // Unassigned file linked to resALegacy (has no orgId/teamId on file doc, only resourceId)
    const fileALinkedLegacy = "2026-10-14_file-a-legacy"
    await ctx.db.insert("files", {
      fileId: fileALinkedLegacy,
      userId,
      resourceId: resALegacy,
      displayName: "file-a-linked-legacy.pdf",
      fileSize: 200,
      contentType: "application/pdf",
      url: "https://example.com/file-a-linked-legacy.pdf",
      ...timestamps,
    })
    await ctx.db.insert("resourceFiles", {
      resourceId: resALegacy,
      fileId: fileALinkedLegacy,
      createdAt: timestamps.createdAt,
    })

    // Files in Subtree B
    const fileB = "2026-10-14_file-b-normal"
    await ctx.db.insert("files", {
      fileId: fileB,
      userId,
      resourceId: resB,
      assignment: { kind: "project", id: projBId },
      orgId: orgBId,
      teamId: teamBId,
      projectId: projBId,
      displayName: "file-b.pdf",
      fileSize: 300,
      contentType: "application/pdf",
      url: "https://example.com/file-b.pdf",
      ...timestamps,
    })
    await ctx.db.insert("resourceFiles", {
      resourceId: resB,
      fileId: fileB,
      createdAt: timestamps.createdAt,
    })

    return {
      userId,
      orgAId,
      teamAId,
      projAId,
      orgBId,
      teamBId,
      projBId,
      resAProject,
      resALegacy,
      resB,
      fileAAssigned,
      fileALinkedLegacy,
      fileB,
    }
  })

  return { t, token, ...data }
}

describe("Hierarchy delete concurrency guard", () => {
  it("resource moved/cleared during root deletion rejected", async () => {
    const { t, token, orgAId, projBId, resAProject, resALegacy } = await setupFixture()

    // Confirm deletion of orgA
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

    // 1. Reassigning resource in deleting tree to another subtree must be rejected
    const moveResult = await t.mutation(internal.resource.resourceEditInternalMutation, {
      resourceId: resAProject,
      assignment: { kind: "project", id: projBId },
    })
    expect(moveResult.success).toBe(false)
    if (moveResult.success) throw new Error("Expected move to fail")
    expect(moveResult.errorMessage).toMatch(/delet/i)

    // 2. Clearing assignment of resource in deleting tree must be rejected
    const clearResult = await t.mutation(internal.resource.resourceEditInternalMutation, {
      resourceId: resAProject,
      assignment: null,
    })
    expect(clearResult.success).toBe(false)
    if (clearResult.success) throw new Error("Expected clear to fail")
    expect(clearResult.errorMessage).toMatch(/delet/i)

    // 3. Legacy-only resource in deleting org must reject clearing/moving
    const legacyMoveResult = await t.mutation(internal.resource.resourceEditInternalMutation, {
      resourceId: resALegacy,
      assignment: { kind: "project", id: projBId },
    })
    expect(legacyMoveResult.success).toBe(false)
    if (legacyMoveResult.success) throw new Error("Expected legacy move to fail")
    expect(legacyMoveResult.errorMessage).toMatch(/delet/i)
  })

  it("files clear/reparent rejected", async () => {
    const { t, token, orgAId, projBId, resB, fileAAssigned, fileALinkedLegacy } = await setupFixture()

    // Confirm deletion of orgA
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

    // 1. Directly assigned file in deleting tree cannot clear assignment
    const fileClearResult = await t.mutation(internal.file.fileEditInternalMutation, {
      fileId: fileAAssigned,
      assignment: null,
    })
    expect(fileClearResult.success).toBe(false)
    if (fileClearResult.success) throw new Error("Expected file clear to fail")
    expect(fileClearResult.errorMessage).toMatch(/delet/i)

    // 2. Directly assigned file cannot be reassigned to other subtree
    const fileReparentResult = await t.mutation(internal.file.fileEditInternalMutation, {
      fileId: fileAAssigned,
      assignment: { kind: "project", id: projBId },
    })
    expect(fileReparentResult.success).toBe(false)
    if (fileReparentResult.success) throw new Error("Expected file reparent to fail")
    expect(fileReparentResult.errorMessage).toMatch(/delet/i)

    // 3. Unassigned file linked to deleting resource cannot detach (resourceId: null)
    const fileDetachResult = await t.mutation(internal.file.fileEditInternalMutation, {
      fileId: fileALinkedLegacy,
      resourceId: null,
    })
    expect(fileDetachResult.success).toBe(false)
    if (fileDetachResult.success) throw new Error("Expected file detach to fail")
    expect(fileDetachResult.errorMessage).toMatch(/delet/i)

    // 4. Unassigned file linked to deleting resource cannot reparent to another resource
    const fileRelinkResult = await t.mutation(internal.file.fileEditInternalMutation, {
      fileId: fileALinkedLegacy,
      resourceId: resB,
    })
    expect(fileRelinkResult.success).toBe(false)
    if (fileRelinkResult.success) throw new Error("Expected file relink to fail")
    expect(fileRelinkResult.errorMessage).toMatch(/delet/i)
  })

  it("resource-linked upload blocked", async () => {
    const { t, token, orgAId, resAProject, resALegacy, userId } = await setupFixture()

    // Confirm deletion of orgA
    const preview = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "org",
      orgId: orgAId,
    })
    expect(preview.success).toBe(true)
    if (!preview.success) throw new Error("Preview failed")

    await t.mutation(api.hierarchyDelete.hierarchyDeleteConfirmMutation, {
      token,
      kind: "org",
      orgId: orgAId,
      fingerprint: preview.data.fingerprint,
    })

    // 1. Upload linked to assigned resource in deleting org is blocked
    const uploadProjectRes = await t.mutation(internal.file.fileCreateInternalMutation, {
      fileId: "2026-10-14_upload-to-del-proj",
      userId,
      resourceId: resAProject,
      displayName: "new-doc.pdf",
      fileSize: 100,
      contentType: "application/pdf",
      url: "https://example.com/new-doc.pdf",
    })
    expect(uploadProjectRes.success).toBe(false)
    if (uploadProjectRes.success) throw new Error("Expected resource-linked upload to fail")
    expect(uploadProjectRes.errorMessage).toMatch(/delet/i)

    // 2. Upload linked to legacy-only resource in deleting org is blocked
    const uploadLegacyRes = await t.mutation(internal.file.fileCreateInternalMutation, {
      fileId: "2026-10-14_upload-to-del-leg",
      userId,
      resourceId: resALegacy,
      displayName: "legacy-doc.pdf",
      fileSize: 100,
      contentType: "application/pdf",
      url: "https://example.com/legacy-doc.pdf",
    })
    expect(uploadLegacyRes.success).toBe(false)
    if (uploadLegacyRes.success) throw new Error("Expected legacy-resource-linked upload to fail")
    expect(uploadLegacyRes.errorMessage).toMatch(/delet/i)
  })

  it("other subtree edit allowed", async () => {
    const { t, token, orgAId, orgBId, projBId, resB, fileB, userId } = await setupFixture()

    // Confirm deletion of orgA (Subtree A)
    const preview = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "org",
      orgId: orgAId,
    })
    expect(preview.success).toBe(true)
    if (!preview.success) throw new Error("Preview failed")

    await t.mutation(api.hierarchyDelete.hierarchyDeleteConfirmMutation, {
      token,
      kind: "org",
      orgId: orgAId,
      fingerprint: preview.data.fingerprint,
    })

    // 1. Resource in Subtree B can be edited
    const resBEdit = await t.mutation(internal.resource.resourceEditInternalMutation, {
      resourceId: resB,
      name: "Resource B Renamed",
    })
    expect(resBEdit.success).toBe(true)

    // Resource in Subtree B can clear assignment
    const resBClear = await t.mutation(internal.resource.resourceEditInternalMutation, {
      resourceId: resB,
      assignment: null,
    })
    expect(resBClear.success).toBe(true)

    // Resource in Subtree B can reassign to Org B
    const resBReassign = await t.mutation(internal.resource.resourceEditInternalMutation, {
      resourceId: resB,
      assignment: { kind: "organization", id: orgBId },
    })
    expect(resBReassign.success).toBe(true)

    // 2. File in Subtree B can be edited
    const fileBEdit = await t.mutation(internal.file.fileEditInternalMutation, {
      fileId: fileB,
      displayName: "file-b-renamed.pdf",
    })
    expect(fileBEdit.success).toBe(true)

    // File in Subtree B can clear assignment
    const fileBClear = await t.mutation(internal.file.fileEditInternalMutation, {
      fileId: fileB,
      assignment: null,
    })
    expect(fileBClear.success).toBe(true)

    // 3. New file can be uploaded and linked to Subtree B resource
    const newUploadB = await t.mutation(internal.file.fileCreateInternalMutation, {
      fileId: "2026-10-14_upload-subtree-b",
      userId,
      resourceId: resB,
      displayName: "healthy-doc.pdf",
      fileSize: 150,
      contentType: "application/pdf",
      url: "https://example.com/healthy-doc.pdf",
    })
    expect(newUploadB.success).toBe(true)
  })

  it("project or note level root deletion locks assigned resource and linked files", async () => {
    const { t, token, projBId, resB, fileB, orgAId, userId } = await setupFixture()

    // Confirm deletion of project B directly (not org)
    const preview = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "project",
      projectId: projBId,
    })
    expect(preview.success).toBe(true)
    if (!preview.success) throw new Error("Preview failed")

    const confirm = await t.mutation(api.hierarchyDelete.hierarchyDeleteConfirmMutation, {
      token,
      kind: "project",
      projectId: projBId,
      fingerprint: preview.data.fingerprint,
    })
    expect(confirm.success).toBe(true)

    // Editing resource B (assigned to project B) must be rejected
    const editResB = await t.mutation(internal.resource.resourceEditInternalMutation, {
      resourceId: resB,
      assignment: null,
    })
    expect(editResB.success).toBe(false)
    if (editResB.success) throw new Error("Expected resource clear during project deletion to fail")
    expect(editResB.errorMessage).toMatch(/delet/i)

    // Editing file B (linked to resource B) must be rejected
    const editFileB = await t.mutation(internal.file.fileEditInternalMutation, {
      fileId: fileB,
      resourceId: null,
    })
    expect(editFileB.success).toBe(false)
    if (editFileB.success) throw new Error("Expected file detach during project deletion to fail")
    expect(editFileB.errorMessage).toMatch(/delet/i)

    // Upload to resource B must be blocked
    const uploadResB = await t.mutation(internal.file.fileCreateInternalMutation, {
      fileId: "2026-10-14_upload-proj-block",
      userId,
      resourceId: resB,
      displayName: "blocked-doc.pdf",
      fileSize: 120,
      contentType: "application/pdf",
      url: "https://example.com/blocked-doc.pdf",
    })
    expect(uploadResB.success).toBe(false)
    if (uploadResB.success) throw new Error("Expected upload to project-deleting resource to fail")
    expect(uploadResB.errorMessage).toMatch(/delet/i)
  })
})
