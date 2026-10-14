/// <reference types="vite/client" />

import { convexTest } from "convex-test"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { api } from "../convex/_generated/api.js"
import schema from "../convex/schema.js"
import { assignmentResolveFn } from "../src/assignment/convex/assignmentResolveFn.ts"
import { apiKeyCredentialHash } from "../src/auth/model/apiKeyCredentialHash.ts"
import { hierarchyDeleteFingerprintCreate } from "../src/hierarchy_delete/model/hierarchyDeleteFingerprintCreate.ts"

const modules = import.meta.glob("../convex/**/*.ts")
const timestamps = { createdAt: "2026-10-13T00:00:00.000Z", updatedAt: "2026-10-13T00:00:00.000Z" }

async function fixtureCreate() {
  const t = convexTest(schema, modules)
  const token = "a".repeat(64)
  const digest = await apiKeyCredentialHash(token)

  const data = await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", { name: "Test User", role: "user", ...timestamps })
    await ctx.db.insert("authApiKeys", {
      userId,
      name: "Confirm Key",
      digest,
      previewFirst3: token.slice(0, 3),
      previewLast3: token.slice(-3),
      createdAt: timestamps.createdAt,
    })

    const orgId = await ctx.db.insert("orgs", {
      orgHandle: "corp",
      name: "Corp Org",
      ...timestamps,
    })

    const team1Id = await ctx.db.insert("teams", { orgId, name: "Team 1", ...timestamps })
    const team2Id = await ctx.db.insert("teams", { orgId, name: "Team 2", ...timestamps })

    const proj1Id = await ctx.db.insert("projects", { orgId, teamId: team1Id, name: "Project 1", ...timestamps })
    const proj2Id = await ctx.db.insert("projects", { orgId, teamId: team1Id, name: "Project 2", ...timestamps })

    const note1Id = await ctx.db.insert("notes", {
      orgId,
      teamId: team1Id,
      projectId: proj1Id,
      title: "Note 1",
      content: "Content 1",
      ...timestamps,
    })
    const note2Id = await ctx.db.insert("notes", {
      orgId,
      teamId: team1Id,
      projectId: proj1Id,
      title: "Note 2",
      content: "Content 2",
      ...timestamps,
    })

    const res1Id = "res_1"
    await ctx.db.insert("orgResources", {
      orgId,
      orgHandle: "corp",
      resourceId: res1Id,
      createdAt: timestamps.createdAt,
    })

    const file1Id = "file_1"
    await ctx.db.insert("files", {
      fileId: file1Id,
      userId,
      orgId,
      teamId: team1Id,
      displayName: "doc.png",
      fileSize: 50,
      contentType: "image/png",
      url: "https://example.com/doc.png",
      ...timestamps,
    })

    return {
      userId,
      orgId,
      team1Id,
      team2Id,
      proj1Id,
      proj2Id,
      note1Id,
      note2Id,
      res1Id,
      file1Id,
    }
  })

  return { t, token, ...data }
}

describe("hierarchyDeleteConfirmMutation and write guards", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })
  it("confirms deletion atomically locking root entity and creating durable pending job with frozen scope", async () => {
    const { t, token, orgId, team1Id, team2Id, proj1Id, proj2Id, note1Id, note2Id, res1Id, file1Id } =
      await fixtureCreate()

    // 1. Obtain preview
    const preview = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "org",
      orgId,
    })
    expect(preview.success).toBe(true)
    if (!preview.success) throw new Error("Preview failed")

    // 2. Confirm deletion
    const confirm = await t.mutation(api.hierarchyDelete.hierarchyDeleteConfirmMutation, {
      token,
      kind: "org",
      orgId,
      fingerprint: preview.data.fingerprint,
    })

    expect(confirm.success).toBe(true)
    if (!confirm.success) throw new Error("Confirm failed")

    expect(confirm.data.status).toBe("pending")
    expect(confirm.data.counts.total).toBe(9)
    expect(confirm.data.fingerprint).toBe(preview.data.fingerprint)

    // Verify root org is locked with deleting: true and deletionJobId
    const lockedOrg = await t.run(async (ctx) => ctx.db.get("orgs", orgId))
    expect(lockedOrg?.deleting).toBe(true)
    expect(lockedOrg?.deletionJobId).toBe(confirm.data.jobId)

    // Verify job in database is durable with frozen scope
    const job = await t.run(async (ctx) => ctx.db.get("hierarchyDeleteJobs", confirm.data.jobId as any))
    expect(job).not.toBeNull()
    expect(job?.status).toBe("pending")
    expect(job?.rootId).toBe(orgId)
    expect(job?.scope.orgIds).toEqual([orgId])
    expect(job?.scope.teamIds).toEqual([team1Id, team2Id].sort())
    expect(job?.scope.projectIds).toEqual([proj1Id, proj2Id].sort())
    expect(job?.scope.noteIds).toEqual([note1Id, note2Id].sort())
    expect(job?.scope.resourceIds).toEqual([res1Id])
    expect(job?.scope.fileIds).toEqual([file1Id])
    expect(job?.scope.orgMemberIds).toEqual([])
    expect(job?.scope.orgInvitationIds).toEqual([])

    // Query status by jobId
    const statusResult = await t.query(api.hierarchyDelete.hierarchyDeleteStatusQuery, {
      token,
      jobId: confirm.data.jobId,
    })
    expect(statusResult.success).toBe(true)
    if (!statusResult.success) throw new Error("Status query failed")
    expect(statusResult.data.job?.jobId).toBe(confirm.data.jobId)
    expect(statusResult.data.job?.status).toBe("pending")
  })

  it("rejects confirm with stale fingerprint when scope changed after preview", async () => {
    const { t, token, orgId, team1Id, proj1Id } = await fixtureCreate()

    const preview = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "org",
      orgId,
    })
    expect(preview.success).toBe(true)
    if (!preview.success) throw new Error("Preview failed")

    // Scope changes: another note is added
    await t.run(async (ctx) => {
      await ctx.db.insert("notes", {
        orgId,
        teamId: team1Id,
        projectId: proj1Id,
        title: "Sneaky New Note",
        content: "New content",
        ...timestamps,
      })
    })

    // Attempt confirm with old fingerprint
    const confirm = await t.mutation(api.hierarchyDelete.hierarchyDeleteConfirmMutation, {
      token,
      kind: "org",
      orgId,
      fingerprint: preview.data.fingerprint,
    })

    expect(confirm.success).toBe(false)
    if (confirm.success) throw new Error("Expected confirm to fail with stale fingerprint")
    expect(confirm.errorMessage).toContain("fingerprint")
  })

  it("rejects confirm when scope is truncated", async () => {
    const { t, token, orgId } = await fixtureCreate()

    const preview = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "org",
      orgId,
      limit: 2, // triggers truncation
    })
    expect(preview.success).toBe(true)
    if (!preview.success) throw new Error("Preview failed")
    expect(preview.data.isTruncated).toBe(true)

    const confirm = await t.mutation(api.hierarchyDelete.hierarchyDeleteConfirmMutation, {
      token,
      kind: "org",
      orgId,
      limit: 2,
      fingerprint: preview.data.fingerprint,
    })

    expect(confirm.success).toBe(false)
    if (confirm.success) throw new Error("Expected confirm to fail when truncated")
    expect(confirm.errorMessage).toContain("truncated")
  })

  it("rejects confirming an already locked root entity", async () => {
    const { t, token, orgId } = await fixtureCreate()

    const preview = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "org",
      orgId,
    })
    expect(preview.success).toBe(true)
    if (!preview.success) throw new Error("Preview failed")

    // First confirm succeeds
    const firstConfirm = await t.mutation(api.hierarchyDelete.hierarchyDeleteConfirmMutation, {
      token,
      kind: "org",
      orgId,
      fingerprint: preview.data.fingerprint,
    })
    expect(firstConfirm.success).toBe(true)

    // Second confirm fails because root is already locked
    const secondConfirm = await t.mutation(api.hierarchyDelete.hierarchyDeleteConfirmMutation, {
      token,
      kind: "org",
      orgId,
      fingerprint: preview.data.fingerprint,
    })
    expect(secondConfirm.success).toBe(false)
    if (secondConfirm.success) throw new Error("Expected double confirm to fail")
    expect(secondConfirm.errorMessage).toMatch(/already locked|already pending/i)
  })

  it("rejects confirm with stale fingerprint when org member or invitation added after preview", async () => {
    const { t, token, orgId, userId } = await fixtureCreate()

    const preview = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "org",
      orgId,
    })
    expect(preview.success).toBe(true)
    if (!preview.success) throw new Error("Preview failed")

    // Add a new member to the org
    await t.run(async (ctx) => {
      await ctx.db.insert("orgMembers", {
        orgId,
        userId,
        orgHandle: "corp",
        role: "member",
        invitedBy: userId,
        createdAt: timestamps.createdAt,
        updatedAt: timestamps.updatedAt,
      })
    })

    // Confirm with stale preview fingerprint should be rejected
    const confirm = await t.mutation(api.hierarchyDelete.hierarchyDeleteConfirmMutation, {
      token,
      kind: "org",
      orgId,
      fingerprint: preview.data.fingerprint,
    })

    expect(confirm.success).toBe(false)
    if (confirm.success) throw new Error("Expected confirm to fail with stale fingerprint")
    expect(confirm.errorMessage).toContain("fingerprint")
  })

  it("root lock prevents org member and invitation creation when org is deleting", async () => {
    const { t, token, orgId, userId } = await fixtureCreate()

    // Preview and confirm org deletion
    const preview = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "org",
      orgId,
    })
    expect(preview.success).toBe(true)
    if (!preview.success) throw new Error("Preview failed")

    const confirm = await t.mutation(api.hierarchyDelete.hierarchyDeleteConfirmMutation, {
      token,
      kind: "org",
      orgId,
      fingerprint: preview.data.fingerprint,
    })
    expect(confirm.success).toBe(true)

    // Attempt to create org member -> rejected!
    const memberCreate = await t.mutation(api.org.orgMemberCreateMutation, {
      token,
      orgHandle: "corp",
      userId,
      role: "member",
    })
    expect(memberCreate.success).toBe(false)
    if (memberCreate.success) throw new Error("Org member creation under deleting org should fail")
    expect(memberCreate.errorMessage).toMatch(/delet/i)

    // Attempt to create org invitation -> rejected!
    const invitationCreate = await t.mutation(api.org.orgInvitation20InitMutation, {
      token,
      orgHandle: "corp",
      invitedName: "New Invitee",
      invitedEmail: "invitee@example.com",
      l: "en",
      role: "member",
    })
    expect(invitationCreate.success).toBe(false)
    if (invitationCreate.success) throw new Error("Org invitation creation under deleting org should fail")
    expect(invitationCreate.errorMessage).toMatch(/delet/i)
  })

  it("root lock prevents child creation across descendants (teams, projects, notes)", async () => {
    const { t, token, orgId, team1Id, proj1Id } = await fixtureCreate()

    // Preview and confirm team1 deletion
    const preview = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "team",
      teamId: team1Id,
    })
    expect(preview.success).toBe(true)
    if (!preview.success) throw new Error("Preview failed")

    const confirm = await t.mutation(api.hierarchyDelete.hierarchyDeleteConfirmMutation, {
      token,
      kind: "team",
      teamId: team1Id,
      fingerprint: preview.data.fingerprint,
    })
    expect(confirm.success).toBe(true)

    // Attempt to create a project under deleting team1 -> rejected by ancestry guard!
    const projectCreate = await t.mutation(api.project.projectCreateMutation, {
      token,
      teamId: team1Id,
      name: "Illegal Project",
    })
    expect(projectCreate.success).toBe(false)
    if (projectCreate.success) throw new Error("Project creation under deleting team should have failed")
    expect(projectCreate.errorMessage).toMatch(/delet/i)

    // Attempt to create a note under proj1 (whose parent team1 is deleting) -> rejected!
    const noteCreate = await t.mutation(api.note.noteCreateMutation, {
      token,
      projectId: proj1Id,
      content: "# Illegal Note\nBody",
    })
    expect(noteCreate.success).toBe(false)
    if (noteCreate.success) throw new Error("Note creation under deleting team's project should have failed")
    expect(noteCreate.errorMessage).toMatch(/delet/i)
  })

  it("root lock prevents writes to locked entity via edit mutations", async () => {
    const { t, token, team1Id } = await fixtureCreate()

    const preview = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "team",
      teamId: team1Id,
    })
    expect(preview.success).toBe(true)
    if (!preview.success) throw new Error("Preview failed")

    await t.mutation(api.hierarchyDelete.hierarchyDeleteConfirmMutation, {
      token,
      kind: "team",
      teamId: team1Id,
      fingerprint: preview.data.fingerprint,
    })

    // Attempt to edit deleting team1 -> rejected!
    const teamEdit = await t.mutation(api.team.teamEditMutation, {
      token,
      teamId: team1Id,
      name: "Renamed Deleting Team",
    })
    expect(teamEdit.success).toBe(false)
    if (teamEdit.success) throw new Error("Editing deleting team should have failed")
    expect(teamEdit.errorMessage).toMatch(/delet/i)
  })

  it("assignment resolver rejects assignments and context targeting in-deletion scope", async () => {
    const { t, token, orgId, team1Id, proj1Id, note1Id } = await fixtureCreate()

    // Lock org for deletion
    const preview = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "org",
      orgId,
    })
    expect(preview.success).toBe(true)
    if (!preview.success) throw new Error("Preview failed")

    await t.mutation(api.hierarchyDelete.hierarchyDeleteConfirmMutation, {
      token,
      kind: "org",
      orgId,
      fingerprint: preview.data.fingerprint,
    })

    // Assignment to org -> rejected
    const orgAssign = await t.run(async (ctx) =>
      assignmentResolveFn(ctx, {
        assignment: { kind: "organization", id: orgId },
      }),
    )
    expect(orgAssign.success).toBe(false)
    if (orgAssign.success) throw new Error("Org assignment should have been rejected")
    expect(orgAssign.errorMessage).toMatch(/delet/i)

    // Assignment to team under deleting org -> rejected
    const teamAssign = await t.run(async (ctx) =>
      assignmentResolveFn(ctx, {
        assignment: { kind: "team", id: team1Id },
      }),
    )
    expect(teamAssign.success).toBe(false)
    if (teamAssign.success) throw new Error("Team assignment should have been rejected")
    expect(teamAssign.errorMessage).toMatch(/delet/i)

    // Assignment to project under deleting org -> rejected
    const projAssign = await t.run(async (ctx) =>
      assignmentResolveFn(ctx, {
        assignment: { kind: "project", id: proj1Id },
      }),
    )
    expect(projAssign.success).toBe(false)
    if (projAssign.success) throw new Error("Project assignment should have been rejected")
    expect(projAssign.errorMessage).toMatch(/delet/i)

    // Assignment to note under deleting org -> rejected
    const noteAssign = await t.run(async (ctx) =>
      assignmentResolveFn(ctx, {
        assignment: { kind: "note", id: note1Id },
      }),
    )
    expect(noteAssign.success).toBe(false)
    if (noteAssign.success) throw new Error("Note assignment should have been rejected")
    expect(noteAssign.errorMessage).toMatch(/delet/i)
  })

  it("existing orgDeleteMutation rejects unconfirmed path avoiding old deletion bypass", async () => {
    const { t, token } = await fixtureCreate()

    const oldDelete = await t.mutation(api.org.orgDeleteMutation, {
      token,
      orgHandle: "corp",
    })

    expect(oldDelete.success).toBe(false)
    if (oldDelete.success) throw new Error("Old direct org delete should be blocked")
    expect(oldDelete.errorMessage).toMatch(/Direct organization deletion is disabled/i)
  })

  it("hierarchyDeleteStatusQuery returns latest job for entity and lists jobs for user", async () => {
    const { t, token, orgId } = await fixtureCreate()

    // Before deletion: status by target returns null job
    const beforeStatus = await t.query(api.hierarchyDelete.hierarchyDeleteStatusQuery, {
      token,
      kind: "org",
      orgId,
    })
    expect(beforeStatus.success).toBe(true)
    if (!beforeStatus.success) throw new Error("Status failed")
    expect(beforeStatus.data.job).toBeNull()

    // Confirm deletion
    const preview = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "org",
      orgId,
    })
    if (!preview.success) throw new Error("Preview failed")

    const confirm = await t.mutation(api.hierarchyDelete.hierarchyDeleteConfirmMutation, {
      token,
      kind: "org",
      orgId,
      fingerprint: preview.data.fingerprint,
    })
    if (!confirm.success) throw new Error("Confirm failed")

    // After deletion: status by target returns pending job
    const targetStatus = await t.query(api.hierarchyDelete.hierarchyDeleteStatusQuery, {
      token,
      kind: "org",
      orgId,
    })
    expect(targetStatus.success).toBe(true)
    if (!targetStatus.success) throw new Error("Target status query failed")
    expect(targetStatus.data.job?.jobId).toBe(confirm.data.jobId)
    expect(targetStatus.data.job?.status).toBe("pending")

    // List recent jobs for signed-in user
    const listStatus = await t.query(api.hierarchyDelete.hierarchyDeleteStatusQuery, {
      token,
    })
    expect(listStatus.success).toBe(true)
    if (!listStatus.success) throw new Error("List status query failed")
    expect(listStatus.data.jobs.length).toBeGreaterThanOrEqual(1)
    expect(listStatus.data.jobs[0]?.jobId).toBe(confirm.data.jobId)
  })

  it("hierarchyDeleteRetryMutation retries failed job with safe same frozen scope and keeps root lock", async () => {
    const { t, token, orgId } = await fixtureCreate()

    const preview = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "org",
      orgId,
    })
    if (!preview.success) throw new Error("Preview failed")

    const confirm = await t.mutation(api.hierarchyDelete.hierarchyDeleteConfirmMutation, {
      token,
      kind: "org",
      orgId,
      fingerprint: preview.data.fingerprint,
    })
    if (!confirm.success) throw new Error("Confirm failed")

    const jobId = confirm.data.jobId

    // Try to retry a pending job -> should fail because not in failed state
    const earlyRetry = await t.mutation((api as any).hierarchyDeleteControl.hierarchyDeleteRetryMutation, {
      token,
      jobId,
    })
    expect(earlyRetry.success).toBe(false)
    if (earlyRetry.success) throw new Error("Expected retry to fail for non-failed job")
    expect(earlyRetry.errorMessage).toMatch(/Cannot retry deletion job that is not in failed state/i)

    // Simulate job failure while keeping root lock
    await t.run(async (ctx) => {
      await ctx.db.patch("hierarchyDeleteJobs", jobId as any, {
        status: "failed",
        error: "R2 transient network failure",
      })
    })

    // Verify root org is still locked during failure
    const orgDuringFailure = await t.run(async (ctx) => ctx.db.get("orgs", orgId))
    expect(orgDuringFailure?.deleting).toBe(true)
    expect(orgDuringFailure?.deletionJobId).toBe(jobId)

    // Retry the failed job
    const retryResult = await t.mutation((api as any).hierarchyDeleteControl.hierarchyDeleteRetryMutation, {
      token,
      jobId,
    })
    expect(retryResult.success).toBe(true)
    if (!retryResult.success) throw new Error("Retry failed")
    expect(retryResult.data.status).toBe("in_progress")
    expect(retryResult.data.fingerprint).toBe(preview.data.fingerprint)

    // Verify job in database is in_progress, error cleared, frozen scope intact
    const retriedJob = await t.run(async (ctx) => ctx.db.get("hierarchyDeleteJobs", jobId as any))
    expect(retriedJob?.status).toBe("in_progress")
    expect(retriedJob?.error).toBeUndefined()
    expect(retriedJob?.fingerprint).toBe(preview.data.fingerprint)
    expect(retriedJob?.scope).toEqual(confirm.data.counts ? expect.any(Object) : expect.anything())

    // Verify root lock is still held
    const orgAfterRetry = await t.run(async (ctx) => ctx.db.get("orgs", orgId))
    expect(orgAfterRetry?.deleting).toBe(true)
    expect(orgAfterRetry?.deletionJobId).toBe(jobId)
  })

  it("hierarchyDeleteRetryMutation rejects retry if root is not locked by this job", async () => {
    const { t, token, orgId } = await fixtureCreate()

    const preview = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "org",
      orgId,
    })
    if (!preview.success) throw new Error("Preview failed")

    const confirm = await t.mutation(api.hierarchyDelete.hierarchyDeleteConfirmMutation, {
      token,
      kind: "org",
      orgId,
      fingerprint: preview.data.fingerprint,
    })
    if (!confirm.success) throw new Error("Confirm failed")

    const jobId = confirm.data.jobId

    // Mark job failed but unlock root entity
    await t.run(async (ctx) => {
      await ctx.db.patch("hierarchyDeleteJobs", jobId as any, {
        status: "failed",
        error: "Job failed",
      })
      await ctx.db.patch("orgs", orgId, {
        deleting: false,
        deletionJobId: undefined,
      })
    })

    const retryResult = await t.mutation((api as any).hierarchyDeleteControl.hierarchyDeleteRetryMutation, {
      token,
      jobId,
    })
    expect(retryResult.success).toBe(false)
    if (retryResult.success) throw new Error("Expected retry to fail when root is not locked")
    expect(retryResult.errorMessage).toMatch(/root entity is not locked/i)
  })
})
