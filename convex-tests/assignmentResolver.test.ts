/// <reference types="vite/client" />

import { convexTest } from "convex-test"
import { expect, test } from "vitest"
import schema from "../convex/schema.js"
import { assignmentResolveFn } from "../src/assignment/convex/assignmentResolveFn.ts"

const modules = import.meta.glob("../convex/**/*.ts")
const timestamps = { createdAt: "2026-10-13T00:00:00.000Z", updatedAt: "2026-10-13T00:00:00.000Z" }

async function hierarchyFixtureCreate() {
  const t = convexTest(schema, modules)
  const data = await t.run(async (ctx) => {
    const orgId = await ctx.db.insert("orgs", { orgHandle: "acme-org", ...timestamps })
    const otherOrgId = await ctx.db.insert("orgs", { orgHandle: "other-org", ...timestamps })

    const teamId = await ctx.db.insert("teams", { orgId, name: "Core Team", ...timestamps })
    const otherTeamId = await ctx.db.insert("teams", { orgId: otherOrgId, name: "Other Team", ...timestamps })

    const projectId = await ctx.db.insert("projects", {
      orgId,
      teamId,
      name: "Core Project",
      ...timestamps,
    })
    const otherProjectId = await ctx.db.insert("projects", {
      orgId: otherOrgId,
      teamId: otherTeamId,
      name: "Other Project",
      ...timestamps,
    })

    const noteId = await ctx.db.insert("notes", {
      orgId,
      teamId,
      projectId,
      title: "Core Note",
      content: "# Core Note content",
      ...timestamps,
    })

    const userId = await ctx.db.insert("users", {
      name: "Test User",
      role: "user",
      ...timestamps,
    })

    return { orgId, otherOrgId, teamId, otherTeamId, projectId, otherProjectId, noteId, userId }
  })
  return { t, ...data }
}

test("assignment resolver resolves unassigned legacy inputs successfully", async () => {
  const { t } = await hierarchyFixtureCreate()
  const result = await t.run(async (ctx) => {
    return assignmentResolveFn(ctx, {})
  })

  expect(result).toEqual({
    success: true,
    data: {
      assignment: undefined,
      orgId: undefined,
      teamId: undefined,
      projectId: undefined,
      noteId: undefined,
    },
  })
})

test("assignment resolver validates organization assignment and rejects child context", async () => {
  const { t, orgId, otherOrgId, teamId } = await hierarchyFixtureCreate()

  const valid = await t.run(async (ctx) => {
    return assignmentResolveFn(ctx, {
      assignment: { kind: "organization", id: orgId },
      orgHandle: "acme-org",
    })
  })
  expect(valid).toEqual({
    success: true,
    data: {
      assignment: { kind: "organization", id: orgId },
      orgId,
      teamId: undefined,
      projectId: undefined,
      noteId: undefined,
    },
  })

  // Mismatched orgId
  const mismatchedOrg = await t.run(async (ctx) => {
    return assignmentResolveFn(ctx, {
      assignment: { kind: "organization", id: orgId },
      orgId: otherOrgId,
    })
  })
  expect(mismatchedOrg.success).toBe(false)

  // Mismatched handle
  const mismatchedHandle = await t.run(async (ctx) => {
    return assignmentResolveFn(ctx, {
      assignment: { kind: "organization", id: orgId },
      orgHandle: "other-org",
    })
  })
  expect(mismatchedHandle.success).toBe(false)

  // Illegal child context passed for org target
  const childContext = await t.run(async (ctx) => {
    return assignmentResolveFn(ctx, {
      assignment: { kind: "organization", id: orgId },
      teamId,
    })
  })
  expect(childContext.success).toBe(false)
})

test("assignment resolver validates team assignment and derives orgId", async () => {
  const { t, orgId, otherOrgId, teamId, projectId } = await hierarchyFixtureCreate()

  const valid = await t.run(async (ctx) => {
    return assignmentResolveFn(ctx, {
      assignment: { kind: "team", id: teamId },
      orgId,
    })
  })
  expect(valid).toEqual({
    success: true,
    data: {
      assignment: { kind: "team", id: teamId },
      orgId,
      teamId,
      projectId: undefined,
      noteId: undefined,
    },
  })

  // Wrong ancestor org
  const wrongOrg = await t.run(async (ctx) => {
    return assignmentResolveFn(ctx, {
      assignment: { kind: "team", id: teamId },
      orgId: otherOrgId,
    })
  })
  expect(wrongOrg.success).toBe(false)

  // Child context rejection
  const childContext = await t.run(async (ctx) => {
    return assignmentResolveFn(ctx, {
      assignment: { kind: "team", id: teamId },
      projectId,
    })
  })
  expect(childContext.success).toBe(false)
})

test("assignment resolver validates project assignment and derives teamId and orgId", async () => {
  const { t, orgId, otherOrgId, teamId, otherTeamId, projectId, noteId } = await hierarchyFixtureCreate()

  const valid = await t.run(async (ctx) => {
    return assignmentResolveFn(ctx, {
      assignment: { kind: "project", id: projectId },
      teamId,
      orgId,
    })
  })
  expect(valid).toEqual({
    success: true,
    data: {
      assignment: { kind: "project", id: projectId },
      orgId,
      teamId,
      projectId,
      noteId: undefined,
    },
  })

  // Wrong team
  const wrongTeam = await t.run(async (ctx) => {
    return assignmentResolveFn(ctx, {
      assignment: { kind: "project", id: projectId },
      teamId: otherTeamId,
    })
  })
  expect(wrongTeam.success).toBe(false)

  // Wrong org
  const wrongOrg = await t.run(async (ctx) => {
    return assignmentResolveFn(ctx, {
      assignment: { kind: "project", id: projectId },
      orgId: otherOrgId,
    })
  })
  expect(wrongOrg.success).toBe(false)

  // Child context rejection
  const childContext = await t.run(async (ctx) => {
    return assignmentResolveFn(ctx, {
      assignment: { kind: "project", id: projectId },
      noteId,
    })
  })
  expect(childContext.success).toBe(false)
})

test("assignment resolver validates note assignment and derives all ancestors", async () => {
  const { t, orgId, otherOrgId, teamId, otherTeamId, projectId, otherProjectId, noteId } =
    await hierarchyFixtureCreate()

  const valid = await t.run(async (ctx) => {
    return assignmentResolveFn(ctx, {
      assignment: { kind: "note", id: noteId },
      projectId,
      teamId,
      orgId,
    })
  })
  expect(valid).toEqual({
    success: true,
    data: {
      assignment: { kind: "note", id: noteId },
      orgId,
      teamId,
      projectId,
      noteId,
    },
  })

  // Wrong project
  const wrongProject = await t.run(async (ctx) => {
    return assignmentResolveFn(ctx, {
      assignment: { kind: "note", id: noteId },
      projectId: otherProjectId,
    })
  })
  expect(wrongProject.success).toBe(false)

  // Wrong team
  const wrongTeam = await t.run(async (ctx) => {
    return assignmentResolveFn(ctx, {
      assignment: { kind: "note", id: noteId },
      teamId: otherTeamId,
    })
  })
  expect(wrongTeam.success).toBe(false)

  // Wrong org
  const wrongOrg = await t.run(async (ctx) => {
    return assignmentResolveFn(ctx, {
      assignment: { kind: "note", id: noteId },
      orgId: otherOrgId,
    })
  })
  expect(wrongOrg.success).toBe(false)
})

test("assignment resolver infers target from ancestor parameters and rejects broken chains", async () => {
  const { t, orgId, teamId, projectId, noteId } = await hierarchyFixtureCreate()

  // Inferred note
  const inferredNote = await t.run(async (ctx) => {
    return assignmentResolveFn(ctx, { noteId })
  })
  expect(inferredNote).toEqual({
    success: true,
    data: {
      assignment: { kind: "note", id: noteId },
      orgId,
      teamId,
      projectId,
      noteId,
    },
  })

  // Inferred project
  const inferredProject = await t.run(async (ctx) => {
    return assignmentResolveFn(ctx, { projectId })
  })
  expect(inferredProject).toEqual({
    success: true,
    data: {
      assignment: { kind: "project", id: projectId },
      orgId,
      teamId,
      projectId,
      noteId: undefined,
    },
  })

  // Broken ancestry chain: delete parent project
  await t.run(async (ctx) => {
    await ctx.db.delete("projects", projectId)
  })

  const orphanNote = await t.run(async (ctx) => {
    return assignmentResolveFn(ctx, { assignment: { kind: "note", id: noteId } })
  })
  expect(orphanNote.success).toBe(false)
})

test("resources and files tables persist assignment metadata and support indexed ancestor queries", async () => {
  const { t, orgId, teamId, projectId, noteId, userId } = await hierarchyFixtureCreate()

  // Resolve assignment for project
  const resolved = await t.run(async (ctx) => {
    return assignmentResolveFn(ctx, { assignment: { kind: "project", id: projectId } })
  })
  expect(resolved.success).toBe(true)
  if (!resolved.success) throw new Error("Resolution failed")

  // Insert resource with resolved assignment
  const resourceConvexId = await t.run(async (ctx) => {
    return ctx.db.insert("resources", {
      resourceId: "res-test-1",
      name: "Resource test",
      ...resolved.data,
      ...timestamps,
    })
  })
  expect(resourceConvexId).toBeTruthy()

  // Insert file with resolved assignment
  const fileConvexId = await t.run(async (ctx) => {
    return ctx.db.insert("files", {
      fileId: "file-test-1",
      url: "https://example.com/test.pdf",
      displayName: "test.pdf",
      fileSize: 1024,
      contentType: "application/pdf",
      userId,
      ...resolved.data,
      ...timestamps,
    })
  })
  expect(fileConvexId).toBeTruthy()

  // Query resources and files using the indexes
  const queryResult = await t.run(async (ctx) => {
    const resByOrg = await ctx.db
      .query("resources")
      .withIndex("orgId", (q) => q.eq("orgId", orgId))
      .collect()

    const resByTeam = await ctx.db
      .query("resources")
      .withIndex("teamId", (q) => q.eq("teamId", teamId))
      .collect()

    const resByProject = await ctx.db
      .query("resources")
      .withIndex("projectId", (q) => q.eq("projectId", projectId))
      .collect()

    const resByNote = await ctx.db
      .query("resources")
      .withIndex("noteId", (q) => q.eq("noteId", noteId))
      .collect()

    const filesByOrg = await ctx.db
      .query("files")
      .withIndex("orgId", (q) => q.eq("orgId", orgId))
      .collect()

    const filesByTeam = await ctx.db
      .query("files")
      .withIndex("teamId", (q) => q.eq("teamId", teamId))
      .collect()

    const filesByProject = await ctx.db
      .query("files")
      .withIndex("projectId", (q) => q.eq("projectId", projectId))
      .collect()

    return { resByOrg, resByTeam, resByProject, resByNote, filesByOrg, filesByTeam, filesByProject }
  })

  expect(queryResult.resByOrg).toHaveLength(1)
  expect(queryResult.resByTeam).toHaveLength(1)
  expect(queryResult.resByProject).toHaveLength(1)
  expect(queryResult.resByNote).toHaveLength(0) // Note was not in derived ancestors for project target

  expect(queryResult.filesByOrg).toHaveLength(1)
  expect(queryResult.filesByTeam).toHaveLength(1)
  expect(queryResult.filesByProject).toHaveLength(1)
})

test("assignment resolver returns Result error on malformed or cross-table IDs without throwing uncaught", async () => {
  const { t, orgId, teamId, projectId, noteId } = await hierarchyFixtureCreate()

  await t.run(async (ctx) => {
    // 1. Malformed ID strings in assignmentTarget
    const malformedOrg = await assignmentResolveFn(ctx, {
      assignment: { kind: "organization", id: "malformed-not-an-id-12345" },
    })
    expect(malformedOrg.success).toBe(false)

    const malformedTeam = await assignmentResolveFn(ctx, {
      assignment: { kind: "team", id: "malformed-not-an-id-12345" },
    })
    expect(malformedTeam.success).toBe(false)

    const malformedProject = await assignmentResolveFn(ctx, {
      assignment: { kind: "project", id: "malformed-not-an-id-12345" },
    })
    expect(malformedProject.success).toBe(false)

    const malformedNote = await assignmentResolveFn(ctx, {
      assignment: { kind: "note", id: "malformed-not-an-id-12345" },
    })
    expect(malformedNote.success).toBe(false)

    // 2. Cross-table IDs in assignmentTarget
    const crossTableOrg = await assignmentResolveFn(ctx, {
      assignment: { kind: "organization", id: noteId },
    })
    expect(crossTableOrg.success).toBe(false)

    const crossTableTeam = await assignmentResolveFn(ctx, {
      assignment: { kind: "team", id: orgId },
    })
    expect(crossTableTeam.success).toBe(false)

    const crossTableProj = await assignmentResolveFn(ctx, {
      assignment: { kind: "project", id: teamId },
    })
    expect(crossTableProj.success).toBe(false)

    const crossTableNote = await assignmentResolveFn(ctx, {
      assignment: { kind: "note", id: projectId },
    })
    expect(crossTableNote.success).toBe(false)

    // 3. Malformed/cross-table in fallback context args
    const malformedFallbackOrg = await assignmentResolveFn(ctx, {
      orgId: "malformed-org-id" as any,
    })
    expect(malformedFallbackOrg.success).toBe(false)

    const malformedFallbackTeam = await assignmentResolveFn(ctx, {
      teamId: "malformed-team-id" as any,
    })
    expect(malformedFallbackTeam.success).toBe(false)

    const malformedFallbackProj = await assignmentResolveFn(ctx, {
      projectId: "malformed-proj-id" as any,
    })
    expect(malformedFallbackProj.success).toBe(false)

    const malformedFallbackNote = await assignmentResolveFn(ctx, {
      noteId: "malformed-note-id" as any,
    })
    expect(malformedFallbackNote.success).toBe(false)
  })
})
