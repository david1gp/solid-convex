/// <reference types="vite/client" />

import { convexTest } from "convex-test"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { api } from "../convex/_generated/api.js"
import schema from "../convex/schema.js"
import { apiKeyCredentialHash } from "../src/auth/model/apiKeyCredentialHash.ts"
import { hierarchyDeleteWorkerDbStepFn } from "../src/hierarchy_delete/convex/hierarchyDeleteWorkerDbStepFn.ts"
import { hierarchyDeleteWorkerRetryFn } from "../src/hierarchy_delete/convex/hierarchyDeleteWorkerRetryFn.ts"
import { hierarchyDeleteWorkerRunFn } from "../src/hierarchy_delete/convex/hierarchyDeleteWorkerRunFn.ts"
import { hierarchyDeleteWorkerStepActionFn } from "../src/hierarchy_delete/convex/hierarchyDeleteWorkerStepActionFn.ts"
import { hierarchyDeleteJobStateCreate } from "../src/hierarchy_delete/model/hierarchyDeleteJobStateCreate.ts"
import type { HierarchyDeleteJobState } from "../src/hierarchy_delete/model/hierarchyDeleteJobStateSchema.ts"
import { r2ObjectDelete } from "../src/r2/api_r2/r2ObjectDelete.ts"
import { userManagementCleanupActionFn } from "../src/user_management/convex/userManagementCleanupActionFn.ts"

vi.mock("../src/r2/api_r2/r2ObjectDelete.ts", () => ({
  r2ObjectDelete: vi.fn(),
}))

vi.mock("../src/user_management/convex/userManagementCleanupActionFn.ts", () => ({
  userManagementCleanupActionFn: vi.fn(),
}))

const modules = import.meta.glob("../convex/**/*.ts")
const timestamps = { createdAt: "2026-10-14T00:00:00.000Z", updatedAt: "2026-10-14T00:00:00.000Z" }

if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = "b7dc996d90e6155ef59d268e3f169ab6feb34d98f18cba0155e5d075e47ef6b1"
}


async function setupWorkerFixture() {
  const t = convexTest(schema, modules)
  const token = "a".repeat(64)
  const digest = await apiKeyCredentialHash(token)

  const data = await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", { name: "Worker Test User", role: "admin", ...timestamps })
    await ctx.db.insert("authApiKeys", {
      userId,
      name: "Worker Test Key",
      digest,
      previewFirst3: token.slice(0, 3),
      previewLast3: token.slice(-3),
      createdAt: timestamps.createdAt,
    })

    // 1. Target Subtree
    const orgAId = await ctx.db.insert("orgs", {
      orgHandle: "target-org",
      name: "Target Org",
      ...timestamps,
    })
    const teamAId = await ctx.db.insert("teams", { orgId: orgAId, name: "Team A", ...timestamps })
    const projAId = await ctx.db.insert("projects", { orgId: orgAId, teamId: teamAId, name: "Proj A", ...timestamps })
    const noteAId = await ctx.db.insert("notes", {
      orgId: orgAId,
      teamId: teamAId,
      projectId: projAId,
      title: "Note A",
      content: "Content A",
      ...timestamps,
    })

    const resAId = "res-target-1"
    await ctx.db.insert("resources", {
      resourceId: resAId,
      orgId: orgAId,
      teamId: teamAId,
      projectId: projAId,
      noteId: noteAId,
      name: "Resource A",
      type: "report",
      visibility: "org",
      language: "en",
      ...timestamps,
    })
    await ctx.db.insert("orgResources", {
      orgId: orgAId,
      orgHandle: "target-org",
      resourceId: resAId,
      createdAt: timestamps.createdAt,
    })

    const fileAId = "file-target-1"
    await ctx.db.insert("files", {
      fileId: fileAId,
      userId,
      resourceId: resAId,
      orgId: orgAId,
      teamId: teamAId,
      projectId: projAId,
      noteId: noteAId,
      displayName: "fileA.pdf",
      fileSize: 1024,
      contentType: "application/pdf",
      url: "https://example.com/fileA.pdf",
      ...timestamps,
    })
    await ctx.db.insert("resourceFiles", {
      resourceId: resAId,
      fileId: fileAId,
      createdAt: timestamps.createdAt,
    })

    // 2. Foreign Subtree (Unrelated)
    const orgBId = await ctx.db.insert("orgs", {
      orgHandle: "foreign-org",
      name: "Foreign Org",
      ...timestamps,
    })
    const teamBId = await ctx.db.insert("teams", { orgId: orgBId, name: "Team B", ...timestamps })
    const projBId = await ctx.db.insert("projects", { orgId: orgBId, teamId: teamBId, name: "Proj B", ...timestamps })
    const noteBId = await ctx.db.insert("notes", {
      orgId: orgBId,
      teamId: teamBId,
      projectId: projBId,
      title: "Note B",
      content: "Content B",
      ...timestamps,
    })

    const resBId = "res-foreign-1"
    await ctx.db.insert("resources", {
      resourceId: resBId,
      orgId: orgBId,
      teamId: teamBId,
      projectId: projBId,
      noteId: noteBId,
      name: "Resource B",
      type: "report",
      visibility: "org",
      language: "en",
      ...timestamps,
    })
    await ctx.db.insert("orgResources", {
      orgId: orgBId,
      orgHandle: "foreign-org",
      resourceId: resBId,
      createdAt: timestamps.createdAt,
    })

    const fileBId = "file-foreign-1"
    await ctx.db.insert("files", {
      fileId: fileBId,
      userId,
      resourceId: resBId,
      orgId: orgBId,
      teamId: teamBId,
      projectId: projBId,
      noteId: noteBId,
      displayName: "fileB.pdf",
      fileSize: 2048,
      contentType: "application/pdf",
      url: "https://example.com/fileB.pdf",
      ...timestamps,
    })
    await ctx.db.insert("resourceFiles", {
      resourceId: resBId,
      fileId: fileBId,
      createdAt: timestamps.createdAt,
    })

    return {
      userId,
      orgAId,
      teamAId,
      projAId,
      noteAId,
      resAId,
      fileAId,
      orgBId,
      teamBId,
      projBId,
      noteBId,
      resBId,
      fileBId,
    }
  })

  return { t, token, ...data }
}

describe("hierarchyDelete worker", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("leaves file metadata intact when R2 deletion fails", async () => {
    const { t, token, orgAId, fileAId } = await setupWorkerFixture()

    // 1. Get confirmed preview scope
    const previewResult = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "org",
      orgId: orgAId,
    })
    expect(previewResult.success).toBe(true)
    if (!previewResult.success) throw new Error("Preview query failed")

    const jobStateResult = await hierarchyDeleteJobStateCreate(previewResult.data)
    expect(jobStateResult.success).toBe(true)
    if (!jobStateResult.success) throw new Error("Job state creation failed")

    // 2. Mock R2 deletion failure
    vi.mocked(r2ObjectDelete).mockResolvedValueOnce({
      success: false,
      op: "r2ObjectDelete",
      errorMessage: "S3 500 Internal Storage Error",
    })

    // Create an ActionCtx mock that has runMutation bound to convexTest
    const mockActionCtx = {
      runMutation: (mutation: any, args: any) => t.mutation(mutation, args),
      runQuery: (query: any, args: any) => t.query(query, args),
      runAction: (action: any, args: any) => t.action(action, args),
    } as any

    // 3. Run worker step
    const stepResult = await hierarchyDeleteWorkerStepActionFn(mockActionCtx, jobStateResult.data)
    expect(stepResult.success).toBe(true)
    if (!stepResult.success) throw new Error("Step failed")

    // State reflects error and is retryable
    expect(stepResult.data.status).toBe("error")
    expect(stepResult.data.isRetryable).toBe(true)
    expect(stepResult.data.errorMessage).toContain("S3 500 Internal Storage Error")
    expect(stepResult.data.phase).toBe("delete_r2_objects")
    expect(stepResult.data.cursor).toBe(0)

    // Crucial requirement: File metadata in files table is NOT removed
    const fileDoc = await t.run((ctx) =>
      ctx.db.query("files").withIndex("fileId", (q) => q.eq("fileId", fileAId)).first(),
    )
    expect(fileDoc).not.toBeNull()
    expect(fileDoc?.fileId).toBe(fileAId)

    // resourceFiles links also still exist
    const rfDoc = await t.run((ctx) =>
      ctx.db.query("resourceFiles").withIndex("resourceIdFileId", (q) => q.eq("resourceId", "res-target-1").eq("fileId", fileAId)).first(),
    )
    expect(rfDoc).not.toBeNull()
  })

  it("retries idempotently after R2 failure and completely removes target while preserving foreign subtree", async () => {
    const { t, token, orgAId, teamAId, projAId, noteAId, resAId, fileAId, orgBId, teamBId, projBId, noteBId, resBId, fileBId } =
      await setupWorkerFixture()

    const previewResult = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "org",
      orgId: orgAId,
    })
    expect(previewResult.success).toBe(true)
    if (!previewResult.success) throw new Error("Preview query failed")

    const jobStateResult = await hierarchyDeleteJobStateCreate(previewResult.data)
    expect(jobStateResult.success).toBe(true)
    if (!jobStateResult.success) throw new Error("Job state creation failed")

    // 1. Initial attempt fails on R2
    vi.mocked(r2ObjectDelete).mockResolvedValueOnce({
      success: false,
      op: "r2ObjectDelete",
      errorMessage: "Connection timeout",
    })

    const mockActionCtx = {
      runMutation: (mutation: any, args: any) => t.mutation(mutation, args),
      runQuery: (query: any, args: any) => t.query(query, args),
      runAction: (action: any, args: any) => t.action(action, args),
    } as any

    const failedStep = await hierarchyDeleteWorkerStepActionFn(mockActionCtx, jobStateResult.data)
    expect(failedStep.success).toBe(true)
    if (!failedStep.success) throw new Error("Failed step")
    expect(failedStep.data.status).toBe("error")

    // Fix R2 and Zitadel mocks
    vi.mocked(r2ObjectDelete).mockResolvedValue({
      success: true,
      data: { fileId: fileAId, deleted: true },
    })
    vi.mocked(userManagementCleanupActionFn).mockResolvedValue({
      success: true,
      data: {
        processedCount: 1,
        updatedUsers: [],
        skippedUserIds: [],
        totalCount: 1,
        nextCursor: null,
        nextOffset: null,
        hasMore: false,
        errors: [],
      },
    })

    // 3. Retry the worker run to completion
    const retryResult = await hierarchyDeleteWorkerRetryFn(mockActionCtx, failedStep.data)
    expect(retryResult.success).toBe(true)
    if (!retryResult.success) throw new Error(retryResult.errorMessage)
    expect(retryResult.data.status).toBe("completed")

    // Target Subtree is completely deleted:
    expect(await t.run((ctx) => ctx.db.query("files").withIndex("fileId", (q) => q.eq("fileId", fileAId)).first())).toBeNull()
    expect(await t.run((ctx) => ctx.db.query("resources").withIndex("resourceId", (q) => q.eq("resourceId", resAId)).first())).toBeNull()
    expect(await t.run((ctx) => ctx.db.get(noteAId))).toBeNull()
    expect(await t.run((ctx) => ctx.db.get(projAId))).toBeNull()
    expect(await t.run((ctx) => ctx.db.get(teamAId))).toBeNull()
    expect(await t.run((ctx) => ctx.db.get(orgAId))).toBeNull()

    // UNRELATED Foreign Subtree survives completely:
    expect(await t.run((ctx) => ctx.db.get(orgBId))).not.toBeNull()
    expect(await t.run((ctx) => ctx.db.get(teamBId))).not.toBeNull()
    expect(await t.run((ctx) => ctx.db.get(projBId))).not.toBeNull()
    expect(await t.run((ctx) => ctx.db.get(noteBId))).not.toBeNull()
    const foreignRes = await t.run((ctx) => ctx.db.query("resources").withIndex("resourceId", (q) => q.eq("resourceId", resBId)).first())
    expect(foreignRes).not.toBeNull()
    const foreignFile = await t.run((ctx) => ctx.db.query("files").withIndex("fileId", (q) => q.eq("fileId", fileBId)).first())
    expect(foreignFile).not.toBeNull()
    const foreignOrgRes = await t.run((ctx) => ctx.db.query("orgResources").withIndex("resourceId", (q) => q.eq("resourceId", resBId)).first())
    expect(foreignOrgRes).not.toBeNull()
  })

  it("keeps batches bounded to 25 items and tracks cursor position accurately", async () => {
    const { t } = await setupWorkerFixture()

    // Create 30 notes in a single project to verify batching <= 25
    const noteIds: string[] = []
    await t.run(async (ctx) => {
      const org = await ctx.db.query("orgs").first()
      const team = await ctx.db.query("teams").first()
      const project = await ctx.db.query("projects").first()
      if (!org || !team || !project) throw new Error("Missing fixtures")

      for (let i = 0; i < 30; i++) {
        const id = await ctx.db.insert("notes", {
          orgId: org._id,
          teamId: team._id,
          projectId: project._id,
          title: `Batch Note ${i}`,
          content: `Content ${i}`,
          ...timestamps,
        })
        noteIds.push(id)
      }
    })

    expect(noteIds).toHaveLength(30)

    // Build job state at delete_notes phase
    const state: HierarchyDeleteJobState = {
      root: { kind: "project", id: "dummy-proj" },
      counts: { orgs: 0, teams: 0, projects: 1, notes: 30, resources: 0, files: 0, total: 31 },
      fingerprint: "dummy",
      scope: {
        orgIds: [],
        teamIds: [],
        projectIds: [],
        noteIds,
        resourceIds: [],
        fileIds: [],
      },
      phase: "delete_notes",
      cursor: 0,
      status: "in_progress",
      isRetryable: false,
    }

    // Step 1: Processes exactly 25 items, cursor moves to 25, remains in delete_notes
    const step1 = await t.run(async (ctx) => hierarchyDeleteWorkerDbStepFn(ctx, state))
    expect(step1.success).toBe(true)
    if (!step1.success) throw new Error("step1 failed")
    expect(step1.data.phase).toBe("delete_notes")
    expect(step1.data.cursor).toBe(25)

    // Verify first 25 notes were deleted, remaining 5 still exist
    await t.run(async (ctx) => {
      const firstNote = await ctx.db.get(noteIds[0] as any)
      expect(firstNote).toBeNull()
      const lastNote = await ctx.db.get(noteIds[29] as any)
      expect(lastNote).not.toBeNull()
    })

    // Step 2: Processes remaining 5 items, cursor resets to 0, transitions to next phase
    const step2 = await t.run(async (ctx) => hierarchyDeleteWorkerDbStepFn(ctx, step1.data))
    expect(step2.success).toBe(true)
    if (!step2.success) throw new Error("step2 failed")
    expect(step2.data.phase).toBe("delete_projects")
    expect(step2.data.cursor).toBe(0)

    // Verify all 30 notes are deleted now
    await t.run(async (ctx) => {
      const lastNote = await ctx.db.get(noteIds[29] as any)
      expect(lastNote).toBeNull()
    })
  })

  it("yields retryable error when team deletion lacks Zitadel credentials", async () => {
    const { t } = await setupWorkerFixture()

    vi.mocked(userManagementCleanupActionFn).mockResolvedValueOnce({
      success: false,
      op: "userManagementCleanupActionFn",
      errorMessage: "Zitadel server credentials unavailable: Invalid Zitadel server configuration in environment",
    })

    const state: HierarchyDeleteJobState = {
      root: { kind: "team", id: "team-to-clean" },
      counts: { orgs: 0, teams: 1, projects: 0, notes: 0, resources: 0, files: 0, total: 1 },
      fingerprint: "dummy",
      scope: {
        orgIds: [],
        teamIds: ["team-to-clean"],
        projectIds: [],
        noteIds: [],
        resourceIds: [],
        fileIds: [],
      },
      phase: "cleanup_teams_zitadel",
      cursor: 0,
      status: "in_progress",
      isRetryable: false,
    }

    const mockActionCtx = {
      runMutation: (mutation: any, args: any) => t.mutation(mutation, args),
      runQuery: (query: any, args: any) => t.query(query, args),
      runAction: (action: any, args: any) => t.action(action, args),
    } as any

    const result = await hierarchyDeleteWorkerStepActionFn(mockActionCtx, state)
    expect(result.success).toBe(true)
    if (!result.success) throw new Error("Unexpected error")

    expect(result.data.status).toBe("error")
    expect(result.data.isRetryable).toBe(true)
    expect(result.data.errorMessage).toContain("Zitadel server credentials unavailable")
  })

  it("removes >100 joins in bounded multiple steps while preserving foreign rows", async () => {
    const { t, userId } = await setupWorkerFixture()

    const targetFileId = "heavy-file-target"
    const foreignFileId = "heavy-file-foreign"

    await t.run(async (ctx) => {
      // Target file
      await ctx.db.insert("files", {
        fileId: targetFileId,
        userId,
        displayName: "target.bin",
        fileSize: 1024,
        contentType: "application/octet-stream",
        url: "https://example.com/target.bin",
        ...timestamps,
      })

      // Foreign file
      await ctx.db.insert("files", {
        fileId: foreignFileId,
        userId,
        displayName: "foreign.bin",
        fileSize: 2048,
        contentType: "application/octet-stream",
        url: "https://example.com/foreign.bin",
        ...timestamps,
      })

      // 120 joins for target file
      for (let i = 0; i < 120; i++) {
        await ctx.db.insert("resourceFiles", {
          resourceId: `res-target-${i}`,
          fileId: targetFileId,
          createdAt: timestamps.createdAt,
        })
      }

      // 10 joins for foreign file
      for (let i = 0; i < 10; i++) {
        await ctx.db.insert("resourceFiles", {
          resourceId: `res-foreign-${i}`,
          fileId: foreignFileId,
          createdAt: timestamps.createdAt,
        })
      }
    })

    const state: HierarchyDeleteJobState = {
      root: { kind: "project", id: "dummy-root" },
      counts: { orgs: 0, teams: 0, projects: 1, notes: 0, resources: 0, files: 1, total: 2 },
      fingerprint: "dummy",
      scope: {
        orgIds: [],
        teamIds: [],
        projectIds: [],
        noteIds: [],
        resourceIds: [],
        fileIds: [targetFileId],
      },
      phase: "delete_file_records",
      cursor: 0,
      status: "in_progress",
      isRetryable: false,
    }

    // Step 1: Takes up to 50 joins, 70 remain -> cursor stays 0, phase stays delete_file_records
    const step1 = await t.run(async (ctx) => hierarchyDeleteWorkerDbStepFn(ctx, state))
    expect(step1.success).toBe(true)
    if (!step1.success) throw new Error("step1 failed")
    expect(step1.data.phase).toBe("delete_file_records")
    expect(step1.data.cursor).toBe(0)

    // Verify 70 target joins remain, foreign 10 joins untouched, file doc still exists
    await t.run(async (ctx) => {
      const targetJoins = await ctx.db
        .query("resourceFiles")
        .withIndex("fileId", (q) => q.eq("fileId", targetFileId))
        .take(200)
      expect(targetJoins).toHaveLength(70)

      const foreignJoins = await ctx.db
        .query("resourceFiles")
        .withIndex("fileId", (q) => q.eq("fileId", foreignFileId))
        .take(20)
      expect(foreignJoins).toHaveLength(10)

      const targetDoc = await ctx.db
        .query("files")
        .withIndex("fileId", (q) => q.eq("fileId", targetFileId))
        .first()
      expect(targetDoc).not.toBeNull()
    })

    // Step 2: Takes next 50 joins, 20 remain -> cursor stays 0
    const step2 = await t.run(async (ctx) => hierarchyDeleteWorkerDbStepFn(ctx, step1.data))
    expect(step2.success).toBe(true)
    if (!step2.success) throw new Error("step2 failed")
    expect(step2.data.phase).toBe("delete_file_records")
    expect(step2.data.cursor).toBe(0)

    await t.run(async (ctx) => {
      const targetJoins = await ctx.db
        .query("resourceFiles")
        .withIndex("fileId", (q) => q.eq("fileId", targetFileId))
        .take(200)
      expect(targetJoins).toHaveLength(20)

      const foreignJoins = await ctx.db
        .query("resourceFiles")
        .withIndex("fileId", (q) => q.eq("fileId", foreignFileId))
        .take(20)
      expect(foreignJoins).toHaveLength(10)
    })

    // Step 3: Takes remaining 20 joins (< 50) and deletes files doc -> phase advances to delete_resources
    const step3 = await t.run(async (ctx) => hierarchyDeleteWorkerDbStepFn(ctx, step2.data))
    expect(step3.success).toBe(true)
    if (!step3.success) throw new Error("step3 failed")
    expect(step3.data.phase).toBe("delete_resources")
    expect(step3.data.cursor).toBe(0)

    // Verify all target joins and file doc are gone, foreign file and joins are untouched
    await t.run(async (ctx) => {
      const targetJoins = await ctx.db
        .query("resourceFiles")
        .withIndex("fileId", (q) => q.eq("fileId", targetFileId))
        .take(10)
      expect(targetJoins).toHaveLength(0)

      const targetDoc = await ctx.db
        .query("files")
        .withIndex("fileId", (q) => q.eq("fileId", targetFileId))
        .first()
      expect(targetDoc).toBeNull()

      const foreignJoins = await ctx.db
        .query("resourceFiles")
        .withIndex("fileId", (q) => q.eq("fileId", foreignFileId))
        .take(20)
      expect(foreignJoins).toHaveLength(10)

      const foreignDoc = await ctx.db
        .query("files")
        .withIndex("fileId", (q) => q.eq("fileId", foreignFileId))
        .first()
      expect(foreignDoc).not.toBeNull()
    })
  })

  it("removes >50 members and >50 invitations repeating until empty before root, preserving foreign rows", async () => {
    const { t, userId } = await setupWorkerFixture()

    let targetOrgId: string = ""
    let foreignOrgId: string = ""

    await t.run(async (ctx) => {
      targetOrgId = await ctx.db.insert("orgs", {
        orgHandle: "heavy-target-org",
        name: "Heavy Target Org",
        ...timestamps,
      })

      foreignOrgId = await ctx.db.insert("orgs", {
        orgHandle: "heavy-foreign-org",
        name: "Heavy Foreign Org",
        ...timestamps,
      })

      // Target org: 60 members, 60 invitations, 10 orgResources
      for (let i = 0; i < 60; i++) {
        await ctx.db.insert("orgMembers", {
          orgId: targetOrgId as any,
          userId,
          orgHandle: "heavy-target-org",
          role: "member",
          invitedBy: "inviter-id",
          ...timestamps,
        })
        await ctx.db.insert("orgInvitations", {
          orgHandle: "heavy-target-org",
          invitationCode: `code-${i}`,
          invitedName: `Target User ${i}`,
          invitedEmail: `inv-${i}@target.com`,
          l: "en",
          role: "member",
          invitedBy: "inviter-id",
          emailSendAmount: 0,
          ...timestamps,
        })
      }
      for (let i = 0; i < 10; i++) {
        await ctx.db.insert("orgResources", {
          orgId: targetOrgId as any,
          orgHandle: "heavy-target-org",
          resourceId: `res-heavy-${i}`,
          createdAt: timestamps.createdAt,
        })
      }

      // Foreign org: 15 members, 15 invitations, 5 orgResources
      for (let i = 0; i < 15; i++) {
        await ctx.db.insert("orgMembers", {
          orgId: foreignOrgId as any,
          userId,
          orgHandle: "heavy-foreign-org",
          role: "member",
          invitedBy: "inviter-id",
          ...timestamps,
        })
        await ctx.db.insert("orgInvitations", {
          orgHandle: "heavy-foreign-org",
          invitationCode: `foreign-code-${i}`,
          invitedName: `Foreign User ${i}`,
          invitedEmail: `inv-${i}@foreign.com`,
          l: "en",
          role: "member",
          invitedBy: "inviter-id",
          emailSendAmount: 0,
          ...timestamps,
        })
      }
      for (let i = 0; i < 5; i++) {
        await ctx.db.insert("orgResources", {
          orgId: foreignOrgId as any,
          orgHandle: "heavy-foreign-org",
          resourceId: `res-foreign-heavy-${i}`,
          createdAt: timestamps.createdAt,
        })
      }
    })

    const state: HierarchyDeleteJobState = {
      root: { kind: "org", id: targetOrgId },
      counts: { orgs: 1, teams: 0, projects: 0, notes: 0, resources: 0, files: 0, total: 1 },
      fingerprint: "dummy",
      scope: {
        orgIds: [targetOrgId],
        teamIds: [],
        projectIds: [],
        noteIds: [],
        resourceIds: [],
        fileIds: [],
      },
      phase: "delete_org_members",
      cursor: 0,
      status: "in_progress",
      isRetryable: false,
    }

    // Step 1: Takes 50 members (10 remain) -> cursor stays 0, phase stays delete_org_members, root preserved
    const step1 = await t.run(async (ctx) => hierarchyDeleteWorkerDbStepFn(ctx, state))
    expect(step1.success).toBe(true)
    if (!step1.success) throw new Error("step1 failed")
    expect(step1.data.phase).toBe("delete_org_members")
    expect(step1.data.cursor).toBe(0)

    await t.run(async (ctx) => {
      const remainingMembers = await ctx.db
        .query("orgMembers")
        .withIndex("orgId", (q) => q.eq("orgId", targetOrgId as any))
        .take(100)
      expect(remainingMembers).toHaveLength(10)

      const foreignMembers = await ctx.db
        .query("orgMembers")
        .withIndex("orgId", (q) => q.eq("orgId", foreignOrgId as any))
        .take(100)
      expect(foreignMembers).toHaveLength(15)

      // Target org doc MUST still exist!
      const targetOrg = await ctx.db.get(targetOrgId as any)
      expect(targetOrg).not.toBeNull()
    })

    // Step 2: Cleans remaining 10 members, then takes 50 invitations (10 remain) -> cursor stays 0
    const step2 = await t.run(async (ctx) => hierarchyDeleteWorkerDbStepFn(ctx, step1.data))
    expect(step2.success).toBe(true)
    if (!step2.success) throw new Error("step2 failed")
    expect(step2.data.phase).toBe("delete_org_members")
    expect(step2.data.cursor).toBe(0)

    await t.run(async (ctx) => {
      const remainingMembers = await ctx.db
        .query("orgMembers")
        .withIndex("orgId", (q) => q.eq("orgId", targetOrgId as any))
        .take(100)
      expect(remainingMembers).toHaveLength(0)

      const remainingInvs = await ctx.db
        .query("orgInvitations")
        .withIndex("orgHandle", (q) => q.eq("orgHandle", "heavy-target-org"))
        .take(100)
      expect(remainingInvs).toHaveLength(10)

      const foreignInvs = await ctx.db
        .query("orgInvitations")
        .withIndex("orgHandle", (q) => q.eq("orgHandle", "heavy-foreign-org"))
        .take(100)
      expect(foreignInvs).toHaveLength(15)

      // Target org root still intact
      const targetOrg = await ctx.db.get(targetOrgId as any)
      expect(targetOrg).not.toBeNull()
    })

    // Step 3: Cleans remaining 10 invitations and 10 orgResources -> all child relationships empty!
    // Transitions to delete_org_roots, cursor: 0. Root STILL exists!
    const step3 = await t.run(async (ctx) => hierarchyDeleteWorkerDbStepFn(ctx, step2.data))
    expect(step3.success).toBe(true)
    if (!step3.success) throw new Error("step3 failed")
    expect(step3.data.phase).toBe("delete_org_roots")
    expect(step3.data.cursor).toBe(0)

    await t.run(async (ctx) => {
      const remainingInvs = await ctx.db
        .query("orgInvitations")
        .withIndex("orgHandle", (q) => q.eq("orgHandle", "heavy-target-org"))
        .take(100)
      expect(remainingInvs).toHaveLength(0)

      const remainingRes = await ctx.db
        .query("orgResources")
        .withIndex("orgHandle", (q) => q.eq("orgHandle", "heavy-target-org"))
        .take(100)
      expect(remainingRes).toHaveLength(0)

      // Root still exists BEFORE delete_org_roots step!
      const targetOrg = await ctx.db.get(targetOrgId as any)
      expect(targetOrg).not.toBeNull()

      // Foreign rows completely preserved
      const foreignMembers = await ctx.db
        .query("orgMembers")
        .withIndex("orgId", (q) => q.eq("orgId", foreignOrgId as any))
        .take(100)
      expect(foreignMembers).toHaveLength(15)

      const foreignInvs = await ctx.db
        .query("orgInvitations")
        .withIndex("orgHandle", (q) => q.eq("orgHandle", "heavy-foreign-org"))
        .take(100)
      expect(foreignInvs).toHaveLength(15)

      const foreignRes = await ctx.db
        .query("orgResources")
        .withIndex("orgHandle", (q) => q.eq("orgHandle", "heavy-foreign-org"))
        .take(100)
      expect(foreignRes).toHaveLength(5)
    })

    // Step 4: delete_org_roots deletes the org root document!
    const step4 = await t.run(async (ctx) => hierarchyDeleteWorkerDbStepFn(ctx, step3.data))
    expect(step4.success).toBe(true)
    if (!step4.success) throw new Error("step4 failed")
    expect(step4.data.phase).toBe("completed")
    expect(step4.data.status).toBe("completed")

    await t.run(async (ctx) => {
      // Target org root is finally deleted
      const targetOrg = await ctx.db.get(targetOrgId as any)
      expect(targetOrg).toBeNull()

      // Foreign org root is still intact!
      const foreignOrg = await ctx.db.get(foreignOrgId as any)
      expect(foreignOrg).not.toBeNull()
    })
  })
})
