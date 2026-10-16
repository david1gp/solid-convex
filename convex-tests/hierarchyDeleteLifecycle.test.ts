/// <reference types="vite/client" />

import { convexTest } from "convex-test"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { api } from "../convex/_generated/api.js"
import schema from "../convex/schema.js"
import { apiKeyCredentialHash } from "../src/auth/model/apiKeyCredentialHash.ts"
import { hierarchyDeleteWorkerDurableStepFn } from "../src/hierarchy_delete/convex/hierarchyDeleteWorkerDurableStepFn.ts"
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

async function setupLifecycleFixture(noteCount = 30) {
  const t = convexTest(schema, modules)
  const token = "a".repeat(64)
  const digest = await apiKeyCredentialHash(token)

  const data = await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", { name: "Lifecycle Admin", role: "admin", ...timestamps })
    await ctx.db.insert("authApiKeys", {
      userId,
      name: "Lifecycle Key",
      digest,
      previewFirst3: token.slice(0, 3),
      previewLast3: token.slice(-3),
      createdAt: timestamps.createdAt,
    })

    const orgId = await ctx.db.insert("orgs", {
      orgHandle: "lifecycle-org",
      name: "Lifecycle Org",
      ...timestamps,
    })

    const teamId = await ctx.db.insert("teams", { orgId, name: "Lifecycle Team", ...timestamps })
    const projId = await ctx.db.insert("projects", { orgId, teamId, name: "Lifecycle Proj", ...timestamps })

    const noteIds: string[] = []
    for (let i = 0; i < noteCount; i++) {
      const noteId = await ctx.db.insert("notes", {
        orgId,
        teamId,
        projectId: projId,
        title: `Lifecycle Note ${i}`,
        content: `Note content ${i}`,
        ...timestamps,
      })
      noteIds.push(noteId)
    }

    const resId = "res-lifecycle-1"
    await ctx.db.insert("resources", {
      resourceId: resId,
      orgId,
      teamId,
      projectId: projId,
      name: "Lifecycle Resource",
      type: "report",
      visibility: "org",
      language: "en",
      ...timestamps,
    })
    await ctx.db.insert("orgResources", {
      orgId,
      orgHandle: "lifecycle-org",
      resourceId: resId,
      createdAt: timestamps.createdAt,
    })

    const fileId = "file-lifecycle-1"
    await ctx.db.insert("files", {
      fileId,
      userId,
      resourceId: resId,
      orgId,
      teamId,
      projectId: projId,
      displayName: "file.pdf",
      fileSize: 4096,
      contentType: "application/pdf",
      url: "https://example.com/file.pdf",
      ...timestamps,
    })
    await ctx.db.insert("resourceFiles", {
      resourceId: resId,
      fileId,
      createdAt: timestamps.createdAt,
    })

    return {
      userId,
      orgId,
      teamId,
      projId,
      noteIds,
      resId,
      fileId,
    }
  })

  return { t, token, ...data }
}

describe("hierarchyDelete registered entry durable lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("completes full lifecycle: confirm -> storage failure -> durable failed -> retry resumes -> >25 notes batching -> completed durable row", async () => {
    const { t, token, orgId, teamId, projId, noteIds, resId, fileId } = await setupLifecycleFixture(30)
    expect(noteIds).toHaveLength(30)

    // 1. Obtain preview
    const previewResult = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "org",
      orgId,
    })
    expect(previewResult.success).toBe(true)
    if (!previewResult.success) throw new Error("Preview query failed")
    expect(previewResult.data.counts.notes).toBe(30)
    expect(previewResult.data.counts.files).toBe(1)

    // 2. Mock R2 storage failure on initial run
    vi.mocked(r2ObjectDelete).mockResolvedValueOnce({
      success: false,
      op: "r2ObjectDelete",
      errorMessage: "S3 500 Internal Storage Error",
    })

    // 3. Confirm deletion through registered entry
    const confirmResult = await t.mutation(api.hierarchyDelete.hierarchyDeleteConfirmMutation, {
      token,
      kind: "org",
      orgId,
      fingerprint: previewResult.data.fingerprint,
    })
    expect(confirmResult.success).toBe(true)
    if (!confirmResult.success) throw new Error("Confirm mutation failed")

    const jobId = confirmResult.data.jobId
    expect(jobId).toBeDefined()

    // 4. Drain scheduled functions until worker failure stops scheduling
    await t.finishAllScheduledFunctions(() => vi.runAllTimers())

    // 5. Verify job is durably marked failed in database with retryable state and exact error
    const failedJobDoc = await t.run(async (ctx) => ctx.db.get("hierarchyDeleteJobs", jobId as any))
    expect(failedJobDoc).not.toBeNull()
    expect(failedJobDoc?.status).toBe("failed")
    expect(failedJobDoc?.phase).toBe("delete_r2_objects")
    expect(failedJobDoc?.cursor).toBe(0)
    expect(failedJobDoc?.isRetryable).toBe(true)
    expect(failedJobDoc?.error).toContain("S3 500 Internal Storage Error")

    // Root lock is preserved during failure
    const lockedOrg = await t.run(async (ctx) => ctx.db.get("orgs", orgId))
    expect(lockedOrg?.deleting).toBe(true)
    expect(lockedOrg?.deletionJobId).toBe(jobId)

    // Database items are intact (no partial deletion of file records or notes)
    expect(
      await t.run(async (ctx) =>
        ctx.db
          .query("files")
          .withIndex("fileId", (q) => q.eq("fileId", fileId))
          .first(),
      ),
    ).not.toBeNull()
    expect(await t.run(async (ctx) => ctx.db.get("notes", noteIds[0] as any))).not.toBeNull()
    expect(await t.run(async (ctx) => ctx.db.get("notes", noteIds[29] as any))).not.toBeNull()

    // 6. Fix mock storage and mock Zitadel cleanup
    vi.mocked(r2ObjectDelete).mockResolvedValue({
      success: true,
      data: { fileId, deleted: true },
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

    // 7. Retry the failed job through registered retry mutation
    const retryResult = await t.mutation((api as any).hierarchyDeleteControl.hierarchyDeleteRetryMutation, {
      token,
      jobId,
    })
    expect(retryResult.success).toBe(true)
    if (!retryResult.success) throw new Error("Retry mutation failed")
    expect(retryResult.data.status).toBe("in_progress")

    // 8. Drain scheduled functions through all phases including >25 note batch transitions
    await t.finishAllScheduledFunctions(() => vi.runAllTimers())

    // 9. Verify durable job record in database is completed
    const completedJobDoc = await t.run(async (ctx) => ctx.db.get("hierarchyDeleteJobs", jobId as any))
    expect(completedJobDoc).not.toBeNull()
    expect(completedJobDoc?.status).toBe("completed")
    expect(completedJobDoc?.phase).toBe("completed")
    expect(completedJobDoc?.error).toBeUndefined()

    // 10. Verify all entities in the hierarchy are deleted
    expect(
      await t.run(async (ctx) =>
        ctx.db
          .query("files")
          .withIndex("fileId", (q) => q.eq("fileId", fileId))
          .first(),
      ),
    ).toBeNull()
    expect(
      await t.run(async (ctx) =>
        ctx.db
          .query("resources")
          .withIndex("resourceId", (q) => q.eq("resourceId", resId))
          .first(),
      ),
    ).toBeNull()
    for (const noteId of noteIds) {
      expect(await t.run(async (ctx) => ctx.db.get("notes", noteId as any))).toBeNull()
    }
    expect(await t.run(async (ctx) => ctx.db.get("projects", projId))).toBeNull()
    expect(await t.run(async (ctx) => ctx.db.get("teams", teamId))).toBeNull()
    expect(await t.run(async (ctx) => ctx.db.get("orgs", orgId))).toBeNull()

    // Status query returns completed status
    const statusQuery = await t.query(api.hierarchyDelete.hierarchyDeleteStatusQuery, {
      token,
      jobId,
    })
    expect(statusQuery.success).toBe(true)
    if (!statusQuery.success) throw new Error("Status query failed")
    expect(statusQuery.data.job?.status).toBe("completed")
    expect(statusQuery.data.job?.phase).toBe("completed")
  })

  it("resumes offsets without repeating first page for >25 users in team cleanup", async () => {
    const { t, token, teamId } = await setupLifecycleFixture(2)

    vi.mocked(r2ObjectDelete).mockResolvedValue({
      success: true,
      data: { fileId: "any", deleted: true },
    })

    // 30 users: page 0 (limit 25) returns hasMore=true, nextCursor="25", nextOffset=25
    // page 1 returns hasMore=false, nextCursor=null
    vi.mocked(userManagementCleanupActionFn)
      .mockResolvedValueOnce({
        success: true,
        data: {
          processedCount: 25,
          updatedUsers: [],
          skippedUserIds: [],
          totalCount: 30,
          nextCursor: "25",
          nextOffset: 25,
          hasMore: true,
          errors: [],
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          processedCount: 5,
          updatedUsers: [],
          skippedUserIds: [],
          totalCount: 30,
          nextCursor: null,
          nextOffset: null,
          hasMore: false,
          errors: [],
        },
      })

    const previewResult = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "team",
      teamId,
    })
    expect(previewResult.success).toBe(true)
    if (!previewResult.success) throw new Error("Preview query failed")

    const confirmResult = await t.mutation(api.hierarchyDelete.hierarchyDeleteConfirmMutation, {
      token,
      kind: "team",
      teamId,
      fingerprint: previewResult.data.fingerprint,
    })
    expect(confirmResult.success).toBe(true)
    if (!confirmResult.success) throw new Error("Confirm mutation failed")

    await t.finishAllScheduledFunctions(() => vi.runAllTimers())

    expect(userManagementCleanupActionFn).toHaveBeenCalledTimes(2)
    // Page 0 called with cursor "0"
    expect(vi.mocked(userManagementCleanupActionFn)).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({ cursor: "0" }),
    )
    // Page 1 resumes with cursor "25", not repeating page 0
    expect(vi.mocked(userManagementCleanupActionFn)).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.objectContaining({ cursor: "25" }),
    )

    const completedJob = await t.run(async (ctx) => ctx.db.get("hierarchyDeleteJobs", confirmResult.data.jobId as any))
    expect(completedJob?.status).toBe("completed")
  })

  it("transitions to durable failed state on thrown R2 error and resumes on retry", async () => {
    const { t, token, orgId, fileId } = await setupLifecycleFixture(2)

    // R2 throws an unexpected error
    vi.mocked(r2ObjectDelete).mockRejectedValueOnce(new Error("R2 unexpected socket hangup"))

    const previewResult = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "org",
      orgId,
    })
    expect(previewResult.success).toBe(true)
    if (!previewResult.success) throw new Error("Preview query failed")

    const confirmResult = await t.mutation(api.hierarchyDelete.hierarchyDeleteConfirmMutation, {
      token,
      kind: "org",
      orgId,
      fingerprint: previewResult.data.fingerprint,
    })
    expect(confirmResult.success).toBe(true)
    if (!confirmResult.success) throw new Error("Confirm mutation failed")

    const jobId = confirmResult.data.jobId
    await t.finishAllScheduledFunctions(() => vi.runAllTimers())

    const failedJobDoc = await t.run(async (ctx) => ctx.db.get("hierarchyDeleteJobs", jobId as any))
    expect(failedJobDoc?.status).toBe("failed")
    expect(failedJobDoc?.phase).toBe("delete_r2_objects")
    expect(failedJobDoc?.cursor).toBe(0)
    expect(failedJobDoc?.isRetryable).toBe(true)
    expect(failedJobDoc?.error).toContain("R2 unexpected socket hangup")

    // Fix R2 and Zitadel mocks, then retry
    vi.mocked(r2ObjectDelete).mockResolvedValue({
      success: true,
      data: { fileId, deleted: true },
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

    const retryResult = await t.mutation((api as any).hierarchyDeleteControl.hierarchyDeleteRetryMutation, {
      token,
      jobId,
    })
    expect(retryResult.success).toBe(true)
    if (!retryResult.success) throw new Error("Retry failed")

    await t.finishAllScheduledFunctions(() => vi.runAllTimers())

    const completedJob = await t.run(async (ctx) => ctx.db.get("hierarchyDeleteJobs", jobId as any))
    expect(completedJob?.status).toBe("completed")
  })

  it("transitions to durable failed state on thrown cleanup action and resumes on retry", async () => {
    const { t, token, teamId, fileId } = await setupLifecycleFixture(2)

    vi.mocked(r2ObjectDelete).mockResolvedValue({
      success: true,
      data: { fileId, deleted: true },
    })
    // userManagementCleanupActionFn throws unexpected error
    vi.mocked(userManagementCleanupActionFn).mockRejectedValueOnce(new Error("Zitadel RPC network timeout"))

    const previewResult = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "team",
      teamId,
    })
    expect(previewResult.success).toBe(true)
    if (!previewResult.success) throw new Error("Preview query failed")

    const confirmResult = await t.mutation(api.hierarchyDelete.hierarchyDeleteConfirmMutation, {
      token,
      kind: "team",
      teamId,
      fingerprint: previewResult.data.fingerprint,
    })
    expect(confirmResult.success).toBe(true)
    if (!confirmResult.success) throw new Error("Confirm mutation failed")

    const jobId = confirmResult.data.jobId
    await t.finishAllScheduledFunctions(() => vi.runAllTimers())

    const failedJobDoc = await t.run(async (ctx) => ctx.db.get("hierarchyDeleteJobs", jobId as any))
    expect(failedJobDoc?.status).toBe("failed")
    expect(failedJobDoc?.phase).toBe("cleanup_teams_zitadel")
    expect(failedJobDoc?.cursor).toBe(0)
    expect(failedJobDoc?.isRetryable).toBe(true)
    expect(failedJobDoc?.error).toContain("Zitadel RPC network timeout")

    // Fix Zitadel cleanup and retry
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

    const retryResult = await t.mutation((api as any).hierarchyDeleteControl.hierarchyDeleteRetryMutation, {
      token,
      jobId,
    })
    expect(retryResult.success).toBe(true)
    if (!retryResult.success) throw new Error("Retry failed")

    await t.finishAllScheduledFunctions(() => vi.runAllTimers())

    const completedJob = await t.run(async (ctx) => ctx.db.get("hierarchyDeleteJobs", jobId as any))
    expect(completedJob?.status).toBe("completed")
  })

  it("explicitly persists failed on cleanup partial errors and retries same page", async () => {
    const { t, token, teamId, fileId } = await setupLifecycleFixture(2)

    vi.mocked(r2ObjectDelete).mockResolvedValue({
      success: true,
      data: { fileId, deleted: true },
    })

    // Return partial errors in result
    vi.mocked(userManagementCleanupActionFn).mockResolvedValueOnce({
      success: true,
      data: {
        processedCount: 1,
        updatedUsers: [],
        skippedUserIds: [],
        totalCount: 1,
        nextCursor: null,
        nextOffset: null,
        hasMore: false,
        errors: [{ userId: "u1", message: "Rate limit exceeded", retryable: true }],
      },
    })

    const previewResult = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "team",
      teamId,
    })
    expect(previewResult.success).toBe(true)
    if (!previewResult.success) throw new Error("Preview query failed")

    const confirmResult = await t.mutation(api.hierarchyDelete.hierarchyDeleteConfirmMutation, {
      token,
      kind: "team",
      teamId,
      fingerprint: previewResult.data.fingerprint,
    })
    expect(confirmResult.success).toBe(true)
    if (!confirmResult.success) throw new Error("Confirm mutation failed")

    const jobId = confirmResult.data.jobId
    await t.finishAllScheduledFunctions(() => vi.runAllTimers())

    const failedJobDoc = await t.run(async (ctx) => ctx.db.get("hierarchyDeleteJobs", jobId as any))
    expect(failedJobDoc?.status).toBe("failed")
    expect(failedJobDoc?.phase).toBe("cleanup_teams_zitadel")
    expect(failedJobDoc?.cursor).toBe(0)
    expect(failedJobDoc?.isRetryable).toBe(true)
    expect(failedJobDoc?.error).toContain("Rate limit exceeded")

    // Fix and retry
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

    const retryResult = await t.mutation((api as any).hierarchyDeleteControl.hierarchyDeleteRetryMutation, {
      token,
      jobId,
    })
    expect(retryResult.success).toBe(true)
    if (!retryResult.success) throw new Error("Retry failed")

    await t.finishAllScheduledFunctions(() => vi.runAllTimers())

    const completedJob = await t.run(async (ctx) => ctx.db.get("hierarchyDeleteJobs", jobId as any))
    expect(completedJob?.status).toBe("completed")
  })

  it("completes full lifecycle for note root deletion", async () => {
    const { t, token, orgId, teamId, projId, noteIds, userId } = await setupLifecycleFixture(2)
    const targetNoteId = noteIds[0]
    const survivingNoteId = noteIds[1]

    // Create a note-assigned resource and file
    const noteResId = "res-note-assigned"
    const noteFileId = "file-note-assigned"
    await t.run(async (ctx) => {
      await ctx.db.insert("resources", {
        resourceId: noteResId,
        orgId,
        teamId,
        projectId: projId,
        noteId: targetNoteId as any,
        name: "Note Specific Resource",
        type: "report",
        visibility: "org",
        language: "en",
        ...timestamps,
      })
      await ctx.db.insert("files", {
        fileId: noteFileId,
        userId,
        resourceId: noteResId,
        orgId,
        teamId,
        projectId: projId,
        noteId: targetNoteId as any,
        displayName: "note_file.pdf",
        fileSize: 1024,
        contentType: "application/pdf",
        url: "https://example.com/note_file.pdf",
        ...timestamps,
      })
    })

    vi.mocked(r2ObjectDelete).mockResolvedValue({
      success: true,
      data: { fileId: noteFileId, deleted: true },
    })

    const previewResult = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "note",
      noteId: targetNoteId,
    })
    expect(previewResult.success).toBe(true)
    if (!previewResult.success) throw new Error("Preview query failed")
    expect(previewResult.data.counts.notes).toBe(1)
    expect(previewResult.data.counts.files).toBe(1)
    expect(previewResult.data.counts.resources).toBe(1)

    const confirmResult = await t.mutation(api.hierarchyDelete.hierarchyDeleteConfirmMutation, {
      token,
      kind: "note",
      noteId: targetNoteId,
      fingerprint: previewResult.data.fingerprint,
    })
    expect(confirmResult.success).toBe(true)
    if (!confirmResult.success) throw new Error("Confirm mutation failed")

    await t.finishAllScheduledFunctions(() => vi.runAllTimers())

    // Target note is deleted
    expect(await t.run(async (ctx) => ctx.db.get("notes", targetNoteId as any))).toBeNull()
    expect(
      await t.run(async (ctx) =>
        ctx.db
          .query("files")
          .withIndex("fileId", (q) => q.eq("fileId", noteFileId))
          .first(),
      ),
    ).toBeNull()
    expect(
      await t.run(async (ctx) =>
        ctx.db
          .query("resources")
          .withIndex("resourceId", (q) => q.eq("resourceId", noteResId))
          .first(),
      ),
    ).toBeNull()

    // Sibling note and parent project, team, org remain intact
    expect(await t.run(async (ctx) => ctx.db.get("notes", survivingNoteId as any))).not.toBeNull()
    expect(await t.run(async (ctx) => ctx.db.get("projects", projId))).not.toBeNull()
    expect(await t.run(async (ctx) => ctx.db.get("teams", teamId))).not.toBeNull()
    expect(await t.run(async (ctx) => ctx.db.get("orgs", orgId))).not.toBeNull()
  })

  it("completes full lifecycle for project root deletion", async () => {
    const { t, token, orgId, teamId, projId, noteIds, resId, fileId } = await setupLifecycleFixture(3)

    vi.mocked(r2ObjectDelete).mockResolvedValue({
      success: true,
      data: { fileId, deleted: true },
    })

    const previewResult = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "project",
      projectId: projId,
    })
    expect(previewResult.success).toBe(true)
    if (!previewResult.success) throw new Error("Preview query failed")
    expect(previewResult.data.counts.projects).toBe(1)
    expect(previewResult.data.counts.notes).toBe(3)

    const confirmResult = await t.mutation(api.hierarchyDelete.hierarchyDeleteConfirmMutation, {
      token,
      kind: "project",
      projectId: projId,
      fingerprint: previewResult.data.fingerprint,
    })
    expect(confirmResult.success).toBe(true)
    if (!confirmResult.success) throw new Error("Confirm mutation failed")

    await t.finishAllScheduledFunctions(() => vi.runAllTimers())

    // Project and descendant notes and files/resources are deleted
    expect(await t.run(async (ctx) => ctx.db.get("projects", projId))).toBeNull()
    for (const noteId of noteIds) {
      expect(await t.run(async (ctx) => ctx.db.get("notes", noteId as any))).toBeNull()
    }
    expect(
      await t.run(async (ctx) =>
        ctx.db
          .query("files")
          .withIndex("fileId", (q) => q.eq("fileId", fileId))
          .first(),
      ),
    ).toBeNull()
    expect(
      await t.run(async (ctx) =>
        ctx.db
          .query("resources")
          .withIndex("resourceId", (q) => q.eq("resourceId", resId))
          .first(),
      ),
    ).toBeNull()

    // Parent team and org remain intact
    expect(await t.run(async (ctx) => ctx.db.get("teams", teamId))).not.toBeNull()
    expect(await t.run(async (ctx) => ctx.db.get("orgs", orgId))).not.toBeNull()
  })

  it("completes full lifecycle for team root deletion including Zitadel team cleanup", async () => {
    const { t, token, orgId, teamId, projId, noteIds, resId, fileId } = await setupLifecycleFixture(2)

    vi.mocked(r2ObjectDelete).mockResolvedValue({
      success: true,
      data: { fileId, deleted: true },
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

    const previewResult = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "team",
      teamId,
    })
    expect(previewResult.success).toBe(true)
    if (!previewResult.success) throw new Error("Preview query failed")
    expect(previewResult.data.counts.teams).toBe(1)
    expect(previewResult.data.counts.projects).toBe(1)

    const confirmResult = await t.mutation(api.hierarchyDelete.hierarchyDeleteConfirmMutation, {
      token,
      kind: "team",
      teamId,
      fingerprint: previewResult.data.fingerprint,
    })
    expect(confirmResult.success).toBe(true)
    if (!confirmResult.success) throw new Error("Confirm mutation failed")

    await t.finishAllScheduledFunctions(() => vi.runAllTimers())

    // Zitadel team cleanup was called with teamId
    expect(userManagementCleanupActionFn).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        deletedTeamIds: [teamId],
      }),
    )

    // Team, project, notes, files/resources deleted
    expect(await t.run(async (ctx) => ctx.db.get("teams", teamId))).toBeNull()
    expect(await t.run(async (ctx) => ctx.db.get("projects", projId))).toBeNull()
    for (const noteId of noteIds) {
      expect(await t.run(async (ctx) => ctx.db.get("notes", noteId as any))).toBeNull()
    }
    expect(
      await t.run(async (ctx) =>
        ctx.db
          .query("files")
          .withIndex("fileId", (q) => q.eq("fileId", fileId))
          .first(),
      ),
    ).toBeNull()
    expect(
      await t.run(async (ctx) =>
        ctx.db
          .query("resources")
          .withIndex("resourceId", (q) => q.eq("resourceId", resId))
          .first(),
      ),
    ).toBeNull()

    // Parent org remains intact
    expect(await t.run(async (ctx) => ctx.db.get("orgs", orgId))).not.toBeNull()
  })

  it("transitions job to failed when initial claim throws once and fail persistence succeeds", async () => {
    const { t, token, orgId } = await setupLifecycleFixture(2)

    const previewResult = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "org",
      orgId,
    })
    expect(previewResult.success).toBe(true)
    if (!previewResult.success) throw new Error("Preview query failed")

    const confirmResult = await t.mutation(api.hierarchyDelete.hierarchyDeleteConfirmMutation, {
      token,
      kind: "org",
      orgId,
      fingerprint: previewResult.data.fingerprint,
    })
    expect(confirmResult.success).toBe(true)
    if (!confirmResult.success) throw new Error("Confirm mutation failed")

    const jobId = confirmResult.data.jobId

    const initialJob = await t.run(async (ctx) => ctx.db.get("hierarchyDeleteJobs", jobId as any))
    expect(initialJob?.status).toBe("pending")

    let mutationCallCount = 0
    const mockActionCtx = {
      runMutation: vi.fn(async (mutation: any, args: any) => {
        mutationCallCount++
        if (mutationCallCount === 1) {
          throw new Error("fetch failed: network transport offline")
        }
        return t.mutation(mutation, args)
      }),
      runQuery: (query: any, args: any) => t.query(query, args),
      runAction: (action: any, args: any) => t.action(action, args),
    } as any

    const stepResult = await hierarchyDeleteWorkerDurableStepFn(mockActionCtx, {
      jobId,
      expectedPhase: "delete_r2_objects",
      expectedCursor: 0,
    })

    expect(stepResult.success).toBe(true)
    expect(mockActionCtx.runMutation).toHaveBeenCalledTimes(2)

    const failedJobDoc = await t.run(async (ctx) => ctx.db.get("hierarchyDeleteJobs", jobId as any))
    expect(failedJobDoc).not.toBeNull()
    expect(failedJobDoc?.status).toBe("failed")
    expect(failedJobDoc?.phase).toBe("delete_r2_objects")
    expect(failedJobDoc?.cursor).toBe(0)
    expect(failedJobDoc?.isRetryable).toBe(true)
    expect(failedJobDoc?.error).toContain("fetch failed: network transport offline")
  })

  it("fails honestly with ResultError when transport is permanently down during claim and persistence", async () => {
    const { t, token, orgId } = await setupLifecycleFixture(2)

    const previewResult = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "org",
      orgId,
    })
    expect(previewResult.success).toBe(true)
    if (!previewResult.success) throw new Error("Preview query failed")

    const confirmResult = await t.mutation(api.hierarchyDelete.hierarchyDeleteConfirmMutation, {
      token,
      kind: "org",
      orgId,
      fingerprint: previewResult.data.fingerprint,
    })
    expect(confirmResult.success).toBe(true)
    if (!confirmResult.success) throw new Error("Confirm mutation failed")

    const jobId = confirmResult.data.jobId

    const mockActionCtx = {
      runMutation: vi.fn().mockRejectedValue(new Error("fetch failed: connection refused")),
      runQuery: (query: any, args: any) => t.query(query, args),
      runAction: (action: any, args: any) => t.action(action, args),
    } as any

    const stepResult = await hierarchyDeleteWorkerDurableStepFn(mockActionCtx, {
      jobId,
      expectedPhase: "delete_r2_objects",
      expectedCursor: 0,
    })

    expect(stepResult.success).toBe(false)
    if (stepResult.success) throw new Error("Expected step to fail")
    expect(stepResult.op).toBe("hierarchyDeleteWorkerDurableStepFn")
    expect(stepResult.errorMessage).toContain("fetch failed: connection refused")
    expect(stepResult.errorMessage).toContain("persistence threw")

    expect(mockActionCtx.runMutation).toHaveBeenCalledTimes(2)
  })

  it("schedules worker using actual registered reference on confirmation", async () => {
    const { t, token, orgId } = await setupLifecycleFixture(1)
    const previewResult = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "org",
      orgId,
    })
    expect(previewResult.success).toBe(true)
    if (!previewResult.success) throw new Error("Preview query failed")

    const confirmResult = await t.mutation(api.hierarchyDelete.hierarchyDeleteConfirmMutation, {
      token,
      kind: "org",
      orgId,
      fingerprint: previewResult.data.fingerprint,
    })
    expect(confirmResult.success).toBe(true)
    if (!confirmResult.success) throw new Error("Confirm failed")

    const scheduled = await t.run(async (ctx) => ctx.db.system.query("_scheduled_functions").collect())
    expect(scheduled.length).toBeGreaterThan(0)
    expect(scheduled[0]?.name).toBe("hierarchyDeleteActions:hierarchyDeleteWorkerStepInternalAction")
    expect(scheduled[0]?.args).toEqual([
      {
        jobId: confirmResult.data.jobId,
        expectedPhase: "delete_r2_objects",
        expectedCursor: 0,
      },
    ])
  })
})
