/// <reference types="vite/client" />

import { convexTest } from "convex-test"
import { describe, expect, it } from "vitest"
import { api } from "../convex/_generated/api.js"
import schema from "../convex/schema.js"
import { apiKeyCredentialHash } from "../src/auth/model/apiKeyCredentialHash.ts"
import { hierarchyDeleteFingerprintCreate } from "../src/hierarchy_delete/model/hierarchyDeleteFingerprintCreate.ts"
import { hierarchyDeleteRootResolveFn } from "../src/hierarchy_delete/convex/hierarchyDeleteRootResolveFn.ts"

const modules = import.meta.glob("../convex/**/*.ts")
const timestamps = { createdAt: "2026-10-13T00:00:00.000Z", updatedAt: "2026-10-13T00:00:00.000Z" }

async function hierarchyDeleteFixtureCreate() {
  const t = convexTest(schema, modules)
  const token = "c".repeat(64)
  const digest = await apiKeyCredentialHash(token)

  const data = await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", { name: "Test User", role: "user", ...timestamps })
    await ctx.db.insert("authApiKeys", {
      userId,
      name: "Hierarchy Delete Test Key",
      digest,
      previewFirst3: token.slice(0, 3),
      previewLast3: token.slice(-3),
      createdAt: timestamps.createdAt,
    })

    // 1. Organization
    const orgId = await ctx.db.insert("orgs", {
      orgHandle: "acme-corp",
      name: "Acme Corporation",
      ...timestamps,
    })

    // Another unrelated org to ensure isolation
    const foreignOrgId = await ctx.db.insert("orgs", {
      orgHandle: "foreign-corp",
      name: "Foreign Corp",
      ...timestamps,
    })

    // 2. Teams
    const team1Id = await ctx.db.insert("teams", { orgId, name: "Team 1", ...timestamps })
    const team2Id = await ctx.db.insert("teams", { orgId, name: "Team 2", ...timestamps })
    const foreignTeamId = await ctx.db.insert("teams", { orgId: foreignOrgId, name: "Foreign Team", ...timestamps })

    // 3. Projects
    const proj1Id = await ctx.db.insert("projects", { orgId, teamId: team1Id, name: "Project 1", ...timestamps })
    const proj2Id = await ctx.db.insert("projects", { orgId, teamId: team1Id, name: "Project 2", ...timestamps })
    const proj3Id = await ctx.db.insert("projects", { orgId, teamId: team2Id, name: "Project 3", ...timestamps })
    const foreignProjId = await ctx.db.insert("projects", {
      orgId: foreignOrgId,
      teamId: foreignTeamId,
      name: "Foreign Project",
      ...timestamps,
    })

    // 4. Notes
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
    const note3Id = await ctx.db.insert("notes", {
      orgId,
      teamId: team1Id,
      projectId: proj2Id,
      title: "Note 3",
      content: "Content 3",
      ...timestamps,
    })
    const note4Id = await ctx.db.insert("notes", {
      orgId,
      teamId: team2Id,
      projectId: proj3Id,
      title: "Note 4",
      content: "Content 4",
      ...timestamps,
    })
    await ctx.db.insert("notes", {
      orgId: foreignOrgId,
      teamId: foreignTeamId,
      projectId: foreignProjId,
      title: "Foreign Note",
      content: "Foreign Content",
      ...timestamps,
    })

    // 5. Legacy Org Resources attached to acme-corp
    const res1Id = "res_uuid_1"
    const res2Id = "res_uuid_2"
    await ctx.db.insert("orgResources", {
      orgId,
      orgHandle: "acme-corp",
      resourceId: res1Id,
      createdAt: timestamps.createdAt,
    })
    await ctx.db.insert("orgResources", {
      orgId,
      orgHandle: "acme-corp",
      resourceId: res2Id,
      createdAt: timestamps.createdAt,
    })
    // Duplicate attachment of res1Id to test resource deduplication
    await ctx.db.insert("orgResources", {
      orgId,
      orgHandle: "acme-corp",
      resourceId: res1Id,
      createdAt: timestamps.createdAt,
    })

    // 6. Files linked via resourceFiles and files.resourceId
    const file1Id = "file_uuid_1"
    const file2Id = "file_uuid_2"
    // file1 linked via resourceFiles to res1Id
    await ctx.db.insert("resourceFiles", {
      resourceId: res1Id,
      fileId: file1Id,
      createdAt: timestamps.createdAt,
    })
    // file1 also has files.resourceId = res1Id (deduplication test: linked through both methods)
    await ctx.db.insert("files", {
      fileId: file1Id,
      userId,
      resourceId: res1Id,
      displayName: "file1.png",
      fileSize: 1024,
      contentType: "image/png",
      url: "https://example.com/file1.png",
      ...timestamps,
    })
    // file2 linked via resourceFiles to res2Id
    await ctx.db.insert("resourceFiles", {
      resourceId: res2Id,
      fileId: file2Id,
      createdAt: timestamps.createdAt,
    })
    await ctx.db.insert("files", {
      fileId: file2Id,
      userId,
      displayName: "file2.pdf",
      fileSize: 2048,
      contentType: "application/pdf",
      url: "https://example.com/file2.pdf",
      ...timestamps,
    })

    return {
      userId,
      orgId,
      foreignOrgId,
      team1Id,
      team2Id,
      proj1Id,
      proj2Id,
      proj3Id,
      note1Id,
      note2Id,
      note3Id,
      note4Id,
      res1Id,
      res2Id,
      file1Id,
      file2Id,
    }
  })

  return { t, token, ...data }
}

describe("hierarchyDeletePreviewQuery", () => {
  it("previews organization cascade with exact deduplicated entity and file counts", async () => {
    const { t, token, orgId, team1Id, team2Id, proj1Id, proj2Id, proj3Id, note1Id, note2Id, note3Id, note4Id, res1Id, res2Id, file1Id, file2Id } =
      await hierarchyDeleteFixtureCreate()

    const result = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "org",
      orgId,
    })

    expect(result.success).toBe(true)
    if (!result.success) throw new Error("Preview query failed")

    expect(result.data.root).toEqual({
      kind: "org",
      id: orgId,
      name: "Acme Corporation",
      orgHandle: "acme-corp",
    })

    expect(result.data.counts).toEqual({
      orgs: 1,
      teams: 2,
      projects: 3,
      notes: 4,
      resources: 2,
      files: 2,
      orgMembers: 0,
      orgInvitations: 0,
      total: 14,
    })

    expect(result.data.isTruncated).toBe(false)
    expect(result.data.fingerprint).toHaveLength(64)

    // Scope contains exactly the discovered IDs and nothing from foreign org
    expect(result.data.scope.orgIds).toEqual([orgId])
    expect(result.data.scope.teamIds).toEqual([team1Id, team2Id].sort())
    expect(result.data.scope.projectIds).toEqual([proj1Id, proj2Id, proj3Id].sort())
    expect(result.data.scope.noteIds).toEqual([note1Id, note2Id, note3Id, note4Id].sort())
    expect(result.data.scope.resourceIds).toEqual([res1Id, res2Id].sort())
    expect(result.data.scope.fileIds).toEqual([file1Id, file2Id].sort())
    expect(result.data.scope.orgMemberIds).toEqual([])
    expect(result.data.scope.orgInvitationIds).toEqual([])

    // Stable fingerprint verification matches re-computation
    const expectedFingerprint = await hierarchyDeleteFingerprintCreate(result.data.scope)
    expect(result.data.fingerprint).toBe(expectedFingerprint)
  })

  it("previews preview for org by orgHandle", async () => {
    const { t, token, orgId } = await hierarchyDeleteFixtureCreate()

    const result = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "org",
      orgHandle: "acme-corp",
    })

    expect(result.success).toBe(true)
    if (!result.success) throw new Error("Preview query failed")
    expect(result.data.root.id).toBe(orgId)
    expect(result.data.counts.orgs).toBe(1)
  })

  it("previews organization cascade including orgMembers and orgInvitations", async () => {
    const { t, token, orgId, userId } = await hierarchyDeleteFixtureCreate()

    const { mId, invId } = await t.run(async (ctx) => {
      const mId = await ctx.db.insert("orgMembers", {
        orgId,
        userId,
        orgHandle: "acme-corp",
        role: "member",
        invitedBy: userId,
        createdAt: timestamps.createdAt,
        updatedAt: timestamps.updatedAt,
      })
      const invId = await ctx.db.insert("orgInvitations", {
        orgHandle: "acme-corp",
        invitationCode: "code123",
        invitedName: "Invited User",
        invitedEmail: "invite@example.com",
        l: "en",
        role: "member",
        invitedBy: userId,
        emailSendAmount: 0,
        createdAt: timestamps.createdAt,
        updatedAt: timestamps.updatedAt,
      })
      return { mId, invId }
    })

    const result = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "org",
      orgId,
    })

    expect(result.success).toBe(true)
    if (!result.success) throw new Error("Preview query failed")

    expect(result.data.counts.orgMembers).toBe(1)
    expect(result.data.counts.orgInvitations).toBe(1)
    expect(result.data.counts.total).toBe(16)
    expect(result.data.scope.orgMemberIds).toEqual([mId])
    expect(result.data.scope.orgInvitationIds).toEqual([invId])
  })

  it("previews team deletion scope correctly", async () => {
    const { t, token, team1Id, proj1Id, proj2Id, note1Id, note2Id, note3Id } = await hierarchyDeleteFixtureCreate()

    const result = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "team",
      teamId: team1Id,
    })

    expect(result.success).toBe(true)
    if (!result.success) throw new Error("Preview query failed")

    expect(result.data.root).toEqual({
      kind: "team",
      id: team1Id,
      name: "Team 1",
    })

    expect(result.data.counts).toEqual({
      orgs: 0,
      teams: 1,
      projects: 2,
      notes: 3,
      resources: 0,
      files: 0,
      orgMembers: 0,
      orgInvitations: 0,
      total: 6,
    })

    expect(result.data.scope.teamIds).toEqual([team1Id])
    expect(result.data.scope.projectIds).toEqual([proj1Id, proj2Id].sort())
    expect(result.data.scope.noteIds).toEqual([note1Id, note2Id, note3Id].sort())
    expect(result.data.scope.orgMemberIds).toEqual([])
    expect(result.data.scope.orgInvitationIds).toEqual([])
  })

  it("previews project deletion scope correctly", async () => {
    const { t, token, proj1Id, note1Id, note2Id } = await hierarchyDeleteFixtureCreate()

    const result = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "project",
      projectId: proj1Id,
    })

    expect(result.success).toBe(true)
    if (!result.success) throw new Error("Preview query failed")

    expect(result.data.root).toEqual({
      kind: "project",
      id: proj1Id,
      name: "Project 1",
    })

    expect(result.data.counts).toEqual({
      orgs: 0,
      teams: 0,
      projects: 1,
      notes: 2,
      resources: 0,
      files: 0,
      orgMembers: 0,
      orgInvitations: 0,
      total: 3,
    })

    expect(result.data.scope.projectIds).toEqual([proj1Id])
    expect(result.data.scope.noteIds).toEqual([note1Id, note2Id].sort())
    expect(result.data.scope.orgMemberIds).toEqual([])
    expect(result.data.scope.orgInvitationIds).toEqual([])
  })

  it("previews note deletion scope correctly", async () => {
    const { t, token, note1Id } = await hierarchyDeleteFixtureCreate()

    const result = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "note",
      noteId: note1Id,
    })

    expect(result.success).toBe(true)
    if (!result.success) throw new Error("Preview query failed")

    expect(result.data.root).toEqual({
      kind: "note",
      id: note1Id,
      name: "Note 1",
    })

    expect(result.data.counts).toEqual({
      orgs: 0,
      teams: 0,
      projects: 0,
      notes: 1,
      resources: 0,
      files: 0,
      orgMembers: 0,
      orgInvitations: 0,
      total: 1,
    })

    expect(result.data.scope.noteIds).toEqual([note1Id])
    expect(result.data.scope.orgMemberIds).toEqual([])
    expect(result.data.scope.orgInvitationIds).toEqual([])
  })

  it("rejects missing or invalid authentication token", async () => {
    const { t, orgId } = await hierarchyDeleteFixtureCreate()

    const noToken = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token: "",
      kind: "org",
      orgId,
    })
    expect(noToken.success).toBe(false)

    const invalidToken = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token: "invalid-token",
      kind: "org",
      orgId,
    })
    expect(invalidToken.success).toBe(false)
  })

  it("rejects non-existent target entities cleanly with Result error", async () => {
    const { t, token } = await hierarchyDeleteFixtureCreate()

    const fakeOrg = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "org",
      orgHandle: "non-existent-handle-xyz",
    })
    expect(fakeOrg.success).toBe(false)
  })

  it("flags isTruncated when max limit is exceeded without hiding truncation", async () => {
    const { t, token, orgId } = await hierarchyDeleteFixtureCreate()

    const result = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "org",
      orgId,
      limit: 2,
    })

    expect(result.success).toBe(true)
    if (!result.success) throw new Error("Preview query failed")
    expect(result.data.isTruncated).toBe(true)
  })

  it("discovers direct subtree resources and files, dedupes joins, and excludes orphan files without metadata", async () => {
    const { t, token, userId, orgId, team1Id, proj1Id, note1Id } = await hierarchyDeleteFixtureCreate()

    // 1. Direct resource assignments to team, project, note, and org
    const resTeamId = "res_team_assigned_1"
    const resProjId = "res_proj_assigned_1"
    const resNoteId = "res_note_assigned_1"
    const resOrgDirectId = "res_org_assigned_1"

    await t.run(async (ctx) => {
      await ctx.db.insert("resources", {
        resourceId: resTeamId,
        orgId,
        teamId: team1Id,
        name: "Team Resource",
        ...timestamps,
      })
      await ctx.db.insert("resources", {
        resourceId: resProjId,
        orgId,
        teamId: team1Id,
        projectId: proj1Id,
        name: "Project Resource",
        ...timestamps,
      })
      await ctx.db.insert("resources", {
        resourceId: resNoteId,
        orgId,
        teamId: team1Id,
        projectId: proj1Id,
        noteId: note1Id,
        name: "Note Resource",
        ...timestamps,
      })
      await ctx.db.insert("resources", {
        resourceId: resOrgDirectId,
        orgId,
        name: "Org Direct Resource",
        ...timestamps,
      })

      // 2. Direct file assignments to team, project, note
      const fileTeamId = "file_team_assigned_1"
      const fileProjId = "file_proj_assigned_1"
      const fileNoteId = "file_note_assigned_1"

      await ctx.db.insert("files", {
        fileId: fileTeamId,
        userId,
        orgId,
        teamId: team1Id,
        displayName: "team_file.png",
        fileSize: 100,
        contentType: "image/png",
        url: "https://example.com/team.png",
        ...timestamps,
      })
      await ctx.db.insert("files", {
        fileId: fileProjId,
        userId,
        orgId,
        teamId: team1Id,
        projectId: proj1Id,
        displayName: "proj_file.png",
        fileSize: 200,
        contentType: "image/png",
        url: "https://example.com/proj.png",
        ...timestamps,
      })
      await ctx.db.insert("files", {
        fileId: fileNoteId,
        userId,
        orgId,
        teamId: team1Id,
        projectId: proj1Id,
        noteId: note1Id,
        displayName: "note_file.png",
        fileSize: 300,
        contentType: "image/png",
        url: "https://example.com/note.png",
        ...timestamps,
      })

      // 3. Deduplication: fileTeamId is also linked via resourceFiles and files.resourceId to resTeamId
      await ctx.db.insert("resourceFiles", {
        resourceId: resTeamId,
        fileId: fileTeamId,
        createdAt: timestamps.createdAt,
      })

      // 4. Orphan join: resourceFiles has a fileId with NO metadata in files table
      const orphanFileId = "file_ghost_orphan_999"
      await ctx.db.insert("resourceFiles", {
        resourceId: resTeamId,
        fileId: orphanFileId,
        createdAt: timestamps.createdAt,
      })
    })

    // Test note preview: note1 has 1 note, 1 direct resource (resNoteId), 1 direct file (fileNoteId)
    const notePreview = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "note",
      noteId: note1Id,
    })
    expect(notePreview.success).toBe(true)
    if (!notePreview.success) throw new Error("Note preview failed")
    expect(notePreview.data.counts).toEqual({
      orgs: 0,
      teams: 0,
      projects: 0,
      notes: 1,
      resources: 1,
      files: 1,
      orgMembers: 0,
      orgInvitations: 0,
      total: 3,
    })
    expect(notePreview.data.scope.resourceIds).toEqual([resNoteId])
    expect(notePreview.data.scope.fileIds).toEqual(["file_note_assigned_1"])

    // Test project preview: proj1 has 1 project, 2 notes (note1, note2),
    // 2 resources (resProjId + resNoteId), 2 files (fileProjId + fileNoteId)
    const projPreview = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "project",
      projectId: proj1Id,
    })
    expect(projPreview.success).toBe(true)
    if (!projPreview.success) throw new Error("Project preview failed")
    expect(projPreview.data.counts).toEqual({
      orgs: 0,
      teams: 0,
      projects: 1,
      notes: 2,
      resources: 2,
      files: 2,
      orgMembers: 0,
      orgInvitations: 0,
      total: 7,
    })
    expect(projPreview.data.scope.resourceIds).toEqual([resNoteId, resProjId].sort())
    expect(projPreview.data.scope.fileIds).toEqual(["file_note_assigned_1", "file_proj_assigned_1"].sort())

    // Test team preview: team1 has 1 team, 2 projects (proj1, proj2), 3 notes (note1, note2, note3),
    // 3 resources (resTeamId, resProjId, resNoteId),
    // 3 files (fileTeamId, fileProjId, fileNoteId).
    // Note: fileTeamId is deduped (direct assignment + resourceFiles).
    // Note: orphanFileId has NO file metadata, so it is strictly EXCLUDED!
    const teamPreview = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "team",
      teamId: team1Id,
    })
    expect(teamPreview.success).toBe(true)
    if (!teamPreview.success) throw new Error("Team preview failed")
    expect(teamPreview.data.counts).toEqual({
      orgs: 0,
      teams: 1,
      projects: 2,
      notes: 3,
      resources: 3,
      files: 3,
      orgMembers: 0,
      orgInvitations: 0,
      total: 12,
    })
    expect(teamPreview.data.scope.resourceIds).toEqual([resNoteId, resProjId, resTeamId].sort())
    expect(teamPreview.data.scope.fileIds).toEqual(
      ["file_note_assigned_1", "file_proj_assigned_1", "file_team_assigned_1"].sort(),
    )
    expect(teamPreview.data.scope.fileIds).not.toContain("file_ghost_orphan_999")
  })

  it("returns Result error on malformed or cross-table IDs without throwing uncaught", async () => {
    const { t, orgId, team1Id, proj1Id } = await hierarchyDeleteFixtureCreate()

    await t.run(async (ctx) => {
      // 1. Malformed IDs
      const malformedOrg = await hierarchyDeleteRootResolveFn(ctx, {
        kind: "org",
        orgId: "malformed-id-12345",
      })
      expect(malformedOrg.success).toBe(false)

      const malformedTeam = await hierarchyDeleteRootResolveFn(ctx, {
        kind: "team",
        teamId: "malformed-id-12345",
      })
      expect(malformedTeam.success).toBe(false)

      const malformedProj = await hierarchyDeleteRootResolveFn(ctx, {
        kind: "project",
        projectId: "malformed-id-12345",
      })
      expect(malformedProj.success).toBe(false)

      const malformedNote = await hierarchyDeleteRootResolveFn(ctx, {
        kind: "note",
        noteId: "malformed-id-12345",
      })
      expect(malformedNote.success).toBe(false)

      // 2. Cross-table IDs
      const crossOrg = await hierarchyDeleteRootResolveFn(ctx, {
        kind: "org",
        orgId: team1Id as any,
      })
      expect(crossOrg.success).toBe(false)

      const crossTeam = await hierarchyDeleteRootResolveFn(ctx, {
        kind: "team",
        teamId: orgId as any,
      })
      expect(crossTeam.success).toBe(false)

      const crossProj = await hierarchyDeleteRootResolveFn(ctx, {
        kind: "project",
        projectId: team1Id as any,
      })
      expect(crossProj.success).toBe(false)

      const crossNote = await hierarchyDeleteRootResolveFn(ctx, {
        kind: "note",
        noteId: proj1Id as any,
      })
      expect(crossNote.success).toBe(false)
    })
  })

  it("rejects wrong parent context and orgId+orgHandle mismatch for preview/resolve", async () => {
    const { t, token, orgId, foreignOrgId, team1Id, team2Id, proj1Id, proj2Id, note1Id } =
      await hierarchyDeleteFixtureCreate()

    await t.run(async (ctx) => {
      // 1. Org: orgId + orgHandle mismatch rejected
      const orgMismatch = await hierarchyDeleteRootResolveFn(ctx, {
        kind: "org",
        orgId,
        orgHandle: "foreign-corp",
      })
      expect(orgMismatch.success).toBe(false)

      // 2. Team: wrong parent orgId or orgHandle rejected
      const teamWrongOrgId = await hierarchyDeleteRootResolveFn(ctx, {
        kind: "team",
        teamId: team1Id,
        orgId: foreignOrgId,
      })
      expect(teamWrongOrgId.success).toBe(false)

      const teamWrongOrgHandle = await hierarchyDeleteRootResolveFn(ctx, {
        kind: "team",
        teamId: team1Id,
        orgHandle: "foreign-corp",
      })
      expect(teamWrongOrgHandle.success).toBe(false)

      const teamMalformedOrgId = await hierarchyDeleteRootResolveFn(ctx, {
        kind: "team",
        teamId: team1Id,
        orgId: "malformed-org-id",
      })
      expect(teamMalformedOrgId.success).toBe(false)

      // 3. Project: wrong parent teamId, orgId, or orgHandle rejected
      const projWrongTeam = await hierarchyDeleteRootResolveFn(ctx, {
        kind: "project",
        projectId: proj1Id,
        teamId: team2Id,
      })
      expect(projWrongTeam.success).toBe(false)

      const projWrongOrgId = await hierarchyDeleteRootResolveFn(ctx, {
        kind: "project",
        projectId: proj1Id,
        orgId: foreignOrgId,
      })
      expect(projWrongOrgId.success).toBe(false)

      const projWrongOrgHandle = await hierarchyDeleteRootResolveFn(ctx, {
        kind: "project",
        projectId: proj1Id,
        orgHandle: "foreign-corp",
      })
      expect(projWrongOrgHandle.success).toBe(false)

      const projMalformedTeam = await hierarchyDeleteRootResolveFn(ctx, {
        kind: "project",
        projectId: proj1Id,
        teamId: "malformed-team-id",
      })
      expect(projMalformedTeam.success).toBe(false)

      // 4. Note: wrong parent projectId, teamId, orgId, or orgHandle rejected
      const noteWrongProj = await hierarchyDeleteRootResolveFn(ctx, {
        kind: "note",
        noteId: note1Id,
        projectId: proj2Id,
      })
      expect(noteWrongProj.success).toBe(false)

      const noteWrongTeam = await hierarchyDeleteRootResolveFn(ctx, {
        kind: "note",
        noteId: note1Id,
        teamId: team2Id,
      })
      expect(noteWrongTeam.success).toBe(false)

      const noteWrongOrgId = await hierarchyDeleteRootResolveFn(ctx, {
        kind: "note",
        noteId: note1Id,
        orgId: foreignOrgId,
      })
      expect(noteWrongOrgId.success).toBe(false)

      const noteWrongOrgHandle = await hierarchyDeleteRootResolveFn(ctx, {
        kind: "note",
        noteId: note1Id,
        orgHandle: "foreign-corp",
      })
      expect(noteWrongOrgHandle.success).toBe(false)

      const noteMalformedProj = await hierarchyDeleteRootResolveFn(ctx, {
        kind: "note",
        noteId: note1Id,
        projectId: "malformed-proj-id",
      })
      expect(noteMalformedProj.success).toBe(false)

      // 5. Correct parent chains resolve successfully
      const validTeam = await hierarchyDeleteRootResolveFn(ctx, {
        kind: "team",
        teamId: team1Id,
        orgId,
        orgHandle: "acme-corp",
      })
      expect(validTeam.success).toBe(true)

      const validProj = await hierarchyDeleteRootResolveFn(ctx, {
        kind: "project",
        projectId: proj1Id,
        teamId: team1Id,
        orgId,
        orgHandle: "acme-corp",
      })
      expect(validProj.success).toBe(true)

      const validNote = await hierarchyDeleteRootResolveFn(ctx, {
        kind: "note",
        noteId: note1Id,
        projectId: proj1Id,
        teamId: team1Id,
        orgId,
        orgHandle: "acme-corp",
      })
      expect(validNote.success).toBe(true)
    })

    // 6. Preview query rejects when wrong parent context is provided from URL
    const queryWrongTeam = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "project",
      projectId: proj1Id,
      teamId: team2Id,
    })
    expect(queryWrongTeam.success).toBe(false)

    const queryWrongOrg = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "team",
      teamId: team1Id,
      orgHandle: "foreign-corp",
    })
    expect(queryWrongOrg.success).toBe(false)
  })

  it("handles same resources direct+legacy exactly at limits with no false truncation and truncates on true extra item", async () => {
    const t = convexTest(schema, modules)
    const token = "d".repeat(64)
    const digest = await apiKeyCredentialHash(token)

    const { orgId } = await t.run(async (ctx) => {
      const userId = await ctx.db.insert("users", { name: "Limits User", role: "user", ...timestamps })
      await ctx.db.insert("authApiKeys", {
        userId,
        name: "Limits Test Key",
        digest,
        previewFirst3: token.slice(0, 3),
        previewLast3: token.slice(-3),
        createdAt: timestamps.createdAt,
      })

      const orgId = await ctx.db.insert("orgs", {
        orgHandle: "dedup-res-org",
        name: "Dedup Res Org",
        ...timestamps,
      })

      // Insert 2 resources directly in resources table
      await ctx.db.insert("resources", {
        resourceId: "res_dedup_1",
        orgId,
        name: "Direct Res 1",
        ...timestamps,
      })
      await ctx.db.insert("resources", {
        resourceId: "res_dedup_2",
        orgId,
        name: "Direct Res 2",
        ...timestamps,
      })

      // Insert the EXACT SAME 2 resources in legacy orgResources
      await ctx.db.insert("orgResources", {
        orgId,
        orgHandle: "dedup-res-org",
        resourceId: "res_dedup_1",
        createdAt: timestamps.createdAt,
      })
      await ctx.db.insert("orgResources", {
        orgId,
        orgHandle: "dedup-res-org",
        resourceId: "res_dedup_2",
        createdAt: timestamps.createdAt,
      })

      return { orgId }
    })

    // Total unique items: 1 org + 2 resources = 3 items.
    // Query with limit: 3 -> exactly at limit, must NOT truncate!
    const atLimitPreview = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "org",
      orgId,
      limit: 3,
    })
    expect(atLimitPreview.success).toBe(true)
    if (!atLimitPreview.success) throw new Error("Preview query failed")
    expect(atLimitPreview.data.counts.resources).toBe(2)
    expect(atLimitPreview.data.counts.total).toBe(3)
    expect(atLimitPreview.data.isTruncated).toBe(false)
    expect(atLimitPreview.data.scope.resourceIds).toEqual(["res_dedup_1", "res_dedup_2"])

    // Add a 3rd distinct resource in legacy orgResources
    await t.run(async (ctx) => {
      await ctx.db.insert("orgResources", {
        orgId,
        orgHandle: "dedup-res-org",
        resourceId: "res_dedup_3",
        createdAt: timestamps.createdAt,
      })
    })

    // Total unique items is now 4 (1 org + 3 resources).
    // Query with limit: 3 -> must flag truncation!
    const truncatedPreview = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "org",
      orgId,
      limit: 3,
    })
    expect(truncatedPreview.success).toBe(true)
    if (!truncatedPreview.success) throw new Error("Preview query failed")
    expect(truncatedPreview.data.isTruncated).toBe(true)
  })

  it("handles file direct+join exactly at limits with no false truncation and truncates on true extra item", async () => {
    const t = convexTest(schema, modules)
    const token = "e".repeat(64)
    const digest = await apiKeyCredentialHash(token)

    const { orgId, userId } = await t.run(async (ctx) => {
      const userId = await ctx.db.insert("users", { name: "File Limits User", role: "user", ...timestamps })
      await ctx.db.insert("authApiKeys", {
        userId,
        name: "File Limits Key",
        digest,
        previewFirst3: token.slice(0, 3),
        previewLast3: token.slice(-3),
        createdAt: timestamps.createdAt,
      })

      const orgId = await ctx.db.insert("orgs", {
        orgHandle: "dedup-file-org",
        name: "Dedup File Org",
        ...timestamps,
      })

      // 1 parent resource
      await ctx.db.insert("resources", {
        resourceId: "res_file_parent",
        orgId,
        name: "File Parent Res",
        ...timestamps,
      })

      // 2 files assigned directly to org AND joined to resource
      await ctx.db.insert("files", {
        fileId: "file_dedup_1",
        userId,
        orgId,
        resourceId: "res_file_parent",
        displayName: "file1.png",
        fileSize: 100,
        contentType: "image/png",
        url: "https://example.com/file1.png",
        ...timestamps,
      })
      await ctx.db.insert("resourceFiles", {
        resourceId: "res_file_parent",
        fileId: "file_dedup_1",
        createdAt: timestamps.createdAt,
      })

      await ctx.db.insert("files", {
        fileId: "file_dedup_2",
        userId,
        orgId,
        resourceId: "res_file_parent",
        displayName: "file2.png",
        fileSize: 200,
        contentType: "image/png",
        url: "https://example.com/file2.png",
        ...timestamps,
      })
      await ctx.db.insert("resourceFiles", {
        resourceId: "res_file_parent",
        fileId: "file_dedup_2",
        createdAt: timestamps.createdAt,
      })

      return { orgId, userId }
    })

    // Total unique items: 1 org + 1 resource + 2 files = 4 items.
    // Query with limit: 4 -> exactly at limit, must NOT truncate!
    const atLimitPreview = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "org",
      orgId,
      limit: 4,
    })
    expect(atLimitPreview.success).toBe(true)
    if (!atLimitPreview.success) throw new Error("Preview query failed")
    expect(atLimitPreview.data.counts.resources).toBe(1)
    expect(atLimitPreview.data.counts.files).toBe(2)
    expect(atLimitPreview.data.counts.total).toBe(4)
    expect(atLimitPreview.data.isTruncated).toBe(false)
    expect(atLimitPreview.data.scope.fileIds).toEqual(["file_dedup_1", "file_dedup_2"])

    // Add a 3rd distinct file joined to the resource
    await t.run(async (ctx) => {
      await ctx.db.insert("files", {
        fileId: "file_dedup_3",
        userId,
        orgId,
        resourceId: "res_file_parent",
        displayName: "file3.png",
        fileSize: 300,
        contentType: "image/png",
        url: "https://example.com/file3.png",
        ...timestamps,
      })
      await ctx.db.insert("resourceFiles", {
        resourceId: "res_file_parent",
        fileId: "file_dedup_3",
        createdAt: timestamps.createdAt,
      })
    })

    // Total unique items is now 5 (1 org + 1 resource + 3 files).
    // Query with limit: 4 -> must flag truncation!
    const truncatedPreview = await t.query(api.hierarchyDelete.hierarchyDeletePreviewQuery, {
      token,
      kind: "org",
      orgId,
      limit: 4,
    })
    expect(truncatedPreview.success).toBe(true)
    if (!truncatedPreview.success) throw new Error("Preview query failed")
    expect(truncatedPreview.data.isTruncated).toBe(true)
  })
})
