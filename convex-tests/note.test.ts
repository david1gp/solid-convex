/// <reference types="vite/client" />

import { convexTest } from "convex-test"
import { expect, test } from "vitest"
import { api } from "../convex/_generated/api.js"
import schema from "../convex/schema.js"
import { apiKeyCredentialHash } from "../src/auth/model/apiKeyCredentialHash.ts"
import { noteUrlBuild } from "../src/note/url/noteUrlBuild.ts"

const modules = import.meta.glob("../convex/**/*.ts")
const timestamps = { createdAt: "2026-10-13T00:00:00.000Z", updatedAt: "2026-10-13T00:00:00.000Z" }

async function noteFixtureCreate() {
  const t = convexTest(schema, modules)
  const token = "a".repeat(64)
  const otherToken = "b".repeat(64)
  const digests = await Promise.all([token, otherToken].map(apiKeyCredentialHash))
  const parents = await t.run(async (ctx) => {
    for (const [index, credential] of [token, otherToken].entries()) {
      const userId = await ctx.db.insert("users", { name: `User ${index}`, role: "user", ...timestamps })
      await ctx.db.insert("authApiKeys", {
        userId,
        name: "Note test",
        digest: digests[index]!,
        previewFirst3: credential.slice(0, 3),
        previewLast3: credential.slice(-3),
        createdAt: timestamps.createdAt,
      })
    }
    const orgId = await ctx.db.insert("orgs", { orgHandle: "note-org", ...timestamps })
    const otherOrgId = await ctx.db.insert("orgs", { orgHandle: "other-org", ...timestamps })
    const teamId = await ctx.db.insert("teams", { orgId, name: "Alpha Team", ...timestamps })
    const otherTeamId = await ctx.db.insert("teams", { orgId: otherOrgId, name: "Beta Team", ...timestamps })
    const projectId = await ctx.db.insert("projects", {
      orgId,
      teamId,
      name: "Alpha Project",
      ...timestamps,
    })
    const otherProjectId = await ctx.db.insert("projects", {
      orgId: otherOrgId,
      teamId: otherTeamId,
      name: "Beta Project",
      ...timestamps,
    })
    const missingProjectId = await ctx.db.insert("projects", {
      orgId,
      teamId,
      name: "Removed Project",
      ...timestamps,
    })
    await ctx.db.delete("projects", missingProjectId)
    return { orgId, otherOrgId, teamId, otherTeamId, projectId, otherProjectId, missingProjectId }
  })
  return { t, token, otherToken, ...parents }
}

test("any authenticated user can create, read, and edit notes with derived title and immutable parents", async () => {
  const { t, token, otherToken, orgId, teamId, projectId } = await noteFixtureCreate()
  const created = await t.mutation(api.note.noteCreateMutation, {
    token,
    projectId,
    content: "# My First Note\n\nThis is the markdown body of the note.",
  })
  expect(created.success).toBe(true)
  if (!created.success) throw new Error("Note fixture creation failed")
  const noteId = created.data

  const before = await t.query(api.note.noteGetQuery, {
    token: otherToken,
    noteId,
    projectId,
    teamId,
    orgId,
  })
  expect(before).toMatchObject({
    success: true,
    data: {
      noteId,
      projectId,
      teamId,
      orgId,
      title: "My First Note",
      content: "# My First Note\n\nThis is the markdown body of the note.",
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    },
  })

  // Edit the note with new content and heading
  const edited = await t.mutation(api.note.noteEditMutation, {
    token: otherToken,
    noteId,
    content: "## Updated Note Heading\n\nUpdated body content here.",
  })
  expect(edited).toEqual({ success: true, data: null })

  const after = await t.query(api.note.noteGetQuery, { token, noteId, orgHandle: "note-org" })
  expect(after).toMatchObject({
    success: true,
    data: {
      noteId,
      projectId,
      teamId,
      orgId,
      title: "Updated Note Heading",
      content: "## Updated Note Heading\n\nUpdated body content here.",
    },
  })
  if (!before.success || !after.success) throw new Error("Note lookup failed")
  expect(after.data.createdAt).toBe(before.data.createdAt)

  // Edit note with empty content derives "Untitled"
  const emptyEdit = await t.mutation(api.note.noteEditMutation, {
    token,
    noteId,
    content: "",
  })
  expect(emptyEdit).toEqual({ success: true, data: null })

  const afterEmpty = await t.query(api.note.noteGetQuery, { token, noteId })
  expect(afterEmpty).toMatchObject({
    success: true,
    data: {
      noteId,
      title: "Untitled",
      content: "",
    },
  })

  // List returns the note
  const list = await t.query(api.note.noteListQuery, { token: otherToken, projectId })
  expect(list).toMatchObject({
    success: true,
    data: { page: [afterEmpty.data], isDone: true },
  })
})

test("all public note operations reject missing and invalid credentials without changing data", async () => {
  const { t, token, projectId } = await noteFixtureCreate()
  const created = await t.mutation(api.note.noteCreateMutation, {
    token,
    projectId,
    content: "# Secure Note\nSensitive text.",
  })
  if (!created.success) throw new Error("Note fixture creation failed")
  const noteId = created.data

  for (const invalidToken of ["", "not-a-credential"]) {
    expect(
      await t.mutation(api.note.noteCreateMutation, {
        token: invalidToken,
        projectId,
        content: "# Unauthorized",
      }),
    ).toMatchObject({ success: false })

    expect(
      await t.mutation(api.note.noteEditMutation, {
        token: invalidToken,
        noteId,
        content: "# Hacked",
      }),
    ).toMatchObject({ success: false })

    expect(await t.query(api.note.noteGetQuery, { token: invalidToken, noteId })).toMatchObject({
      success: false,
    })

    expect(await t.query(api.note.noteListQuery, { token: invalidToken })).toMatchObject({ success: false })
  }

  expect(await t.query(api.note.noteListQuery, { token, projectId })).toMatchObject({
    success: true,
    data: { page: [{ title: "Secure Note" }], isDone: true },
  })
})

test("note mutations validate parent context and ancestry using projectGetFn", async () => {
  const { t, token, orgId, otherOrgId, teamId, otherTeamId, projectId, otherProjectId, missingProjectId } =
    await noteFixtureCreate()

  // Creation fails with invalid parent context or nonexistent parent
  for (const args of [
    { projectId: missingProjectId, content: "Missing parent project" },
    { projectId, orgHandle: "wrong-org-handle", content: "Wrong org handle" },
    { projectId, orgId: otherOrgId, content: "Wrong org context" },
    { projectId, teamId: otherTeamId, content: "Wrong team context" },
  ]) {
    expect(await t.mutation(api.note.noteCreateMutation, { token, ...args })).toMatchObject({ success: false })
  }

  const created = await t.mutation(api.note.noteCreateMutation, {
    token,
    projectId,
    content: "# Valid Note",
  })
  if (!created.success) throw new Error("Note fixture creation failed")
  const noteId = created.data

  // Context mismatch on query or edit fails
  for (const context of [
    { projectId: otherProjectId },
    { teamId: otherTeamId },
    { orgId: otherOrgId },
    { orgHandle: "other-org" },
  ]) {
    expect(await t.query(api.note.noteGetQuery, { token, noteId, ...context })).toMatchObject({
      success: false,
    })
    expect(
      await t.mutation(api.note.noteEditMutation, {
        token,
        noteId,
        content: "# Reparented attempt",
        ...context,
      }),
    ).toMatchObject({ success: false })
  }

  // Deleting parent project breaks ancestry check
  await t.run((ctx) => ctx.db.delete("projects", projectId))
  expect(await t.query(api.note.noteGetQuery, { token, noteId })).toMatchObject({ success: false })
  expect(
    await t.mutation(api.note.noteEditMutation, {
      token,
      noteId,
      content: "# Orphan note edit",
    }),
  ).toMatchObject({ success: false })
  expect(await t.query(api.note.noteListQuery, { token, projectId })).toMatchObject({ success: false })
})

test("note detail and edit return Results for a nonexistent stable note ID", async () => {
  const { t, token, projectId, teamId, orgId } = await noteFixtureCreate()
  const noteId = await t.run(async (ctx) => {
    const id = await ctx.db.insert("notes", {
      projectId,
      teamId,
      orgId,
      title: "Removed Note",
      content: "# Removed Note",
      ...timestamps,
    })
    await ctx.db.delete("notes", id)
    return id
  })

  expect(await t.query(api.note.noteGetQuery, { token, noteId })).toMatchObject({ success: false })
  expect(await t.mutation(api.note.noteEditMutation, { token, noteId, content: "# Missing" })).toMatchObject({
    success: false,
  })
})

test("note detail returns structured Result error for malformed note ID rather than throwing validator error", async () => {
  const { t, token } = await noteFixtureCreate()
  const result = await t.query(api.note.noteGetQuery, { token, noteId: "malformed-note-id" })
  expect(result).toMatchObject({
    success: false,
    errorMessage: "Note not found",
  })
})

test("indexed note queries support project, team, organization, and global queries with bounded cursor pagination", async () => {
  const { t, token, projectId, otherProjectId, teamId, otherTeamId, orgId, otherOrgId } = await noteFixtureCreate()

  const expected = await t.run(async (ctx) => {
    const ids = []
    for (let index = 0; index < 105; index += 1) {
      ids.push(
        await ctx.db.insert("notes", {
          projectId,
          teamId,
          orgId,
          title: `Note ${index}`,
          content: `# Note ${index}\nBody`,
          ...timestamps,
        }),
      )
      await ctx.db.insert("notes", {
        projectId: otherProjectId,
        teamId: otherTeamId,
        orgId: otherOrgId,
        title: `Other Note ${index}`,
        content: `# Other Note ${index}\nBody`,
        ...timestamps,
      })
    }
    return ids
  })

  // Project-scoped query
  const actual = []
  let cursor: string | null = null
  let isDone = false
  for (let index = 0; index < 10 && !isDone; index += 1) {
    const result = await t.query(api.note.noteListQuery, {
      token,
      projectId,
      paginationOpts: { numItems: 20, cursor },
    })
    if (!result.success) throw new Error("Note pagination failed")
    expect(result.data.page.length).toBeLessThanOrEqual(20)
    expect(
      result.data.page.every((note) => note.projectId === projectId && note.teamId === teamId && note.orgId === orgId),
    ).toBe(true)
    actual.push(...result.data.page.map((note) => note.noteId))
    cursor = result.data.continueCursor
    isDone = result.data.isDone
  }
  expect(isDone).toBe(true)
  expect(actual).toEqual(expected)
  expect(new Set(actual).size).toBe(expected.length)

  // Team-scoped query
  const teamResult = await t.query(api.note.noteListQuery, {
    token,
    teamId,
    paginationOpts: { numItems: 50, cursor: null },
  })
  expect(teamResult.success).toBe(true)
  if (!teamResult.success) throw new Error("Team note pagination failed")
  expect(teamResult.data.page.every((note) => note.teamId === teamId)).toBe(true)

  // Org-scoped query
  const orgResult = await t.query(api.note.noteListQuery, {
    token,
    orgId,
    paginationOpts: { numItems: 50, cursor: null },
  })
  expect(orgResult.success).toBe(true)
  if (!orgResult.success) throw new Error("Org note pagination failed")
  expect(orgResult.data.page.every((note) => note.orgId === orgId)).toBe(true)

  // Global query
  const global = await t.query(api.note.noteListQuery, { token })
  expect(global).toMatchObject({ success: true, data: { isDone: false } })
  if (!global.success) throw new Error("Global note pagination failed")
  expect(global.data.page).toHaveLength(50)
  expect(new Set(global.data.page.map((n) => n.orgId))).toEqual(new Set([orgId, otherOrgId]))

  // Pagination bounds checking
  for (const numItems of [0, -1, 1.5, 101]) {
    expect(await t.query(api.note.noteListQuery, { token, paginationOpts: { numItems, cursor: null } })).toMatchObject({
      success: false,
    })
  }
  expect(
    await t.query(api.note.noteListQuery, { token, paginationOpts: { numItems: 10, cursor: "invalid-cursor" } }),
  ).toMatchObject({ success: false, op: "noteListQuery" })
})

test("note URL builders validate explicit hierarchy context", () => {
  // Global list
  expect(noteUrlBuild({ view: "list" })).toEqual({ success: true, data: "/note" })

  // Org list
  expect(noteUrlBuild({ view: "list", orgHandle: "my-org" })).toEqual({
    success: true,
    data: "/org/my-org/note",
  })

  // Team list
  expect(noteUrlBuild({ view: "list", teamId: "t1" })).toEqual({
    success: true,
    data: "/team/t1/note",
  })

  // Project list
  expect(noteUrlBuild({ view: "list", projectId: "p1" })).toEqual({
    success: true,
    data: "/project/p1/note",
  })

  // Full ancestry list
  expect(noteUrlBuild({ view: "list", orgHandle: "my-org", teamId: "t1", projectId: "p1" })).toEqual({
    success: true,
    data: "/org/my-org/team/t1/project/p1/note",
  })

  // Create requiring projectId
  expect(noteUrlBuild({ view: "create", projectId: "p1" })).toEqual({
    success: true,
    data: "/project/p1/note/create",
  })
  expect(noteUrlBuild({ view: "create", orgHandle: "my-org", teamId: "t1", projectId: "p1" })).toEqual({
    success: true,
    data: "/org/my-org/team/t1/project/p1/note/create",
  })
  // create without projectId fails validation
  expect(noteUrlBuild({ view: "create" })).toMatchObject({ success: false })

  // Detail view
  expect(noteUrlBuild({ view: "detail", noteId: "n1" })).toEqual({
    success: true,
    data: "/note/n1",
  })
  expect(noteUrlBuild({ view: "detail", projectId: "p1", noteId: "n1" })).toEqual({
    success: true,
    data: "/project/p1/note/n1",
  })

  // Edit view
  expect(noteUrlBuild({ view: "edit", orgHandle: "my-org", teamId: "t1", projectId: "p1", noteId: "n1" })).toEqual({
    success: true,
    data: "/org/my-org/team/t1/project/p1/note/n1/edit",
  })
})

test("note edit requires content and rejects omission to prevent silent content erasure", async () => {
  const { t, token, projectId } = await noteFixtureCreate()
  const created = await t.mutation(api.note.noteCreateMutation, {
    token,
    projectId,
    content: "# Keep This Content\nImportant note details.",
  })
  expect(created.success).toBe(true)
  if (!created.success) throw new Error("Note creation failed")
  const noteId = created.data

  await expect(
    // @ts-expect-error testing runtime omission of required content
    t.mutation(api.note.noteEditMutation, {
      token,
      noteId,
    }),
  ).rejects.toThrow()

  const current = await t.query(api.note.noteGetQuery, { token, noteId })
  expect(current).toMatchObject({
    success: true,
    data: {
      noteId,
      title: "Keep This Content",
      content: "# Keep This Content\nImportant note details.",
    },
  })
})
