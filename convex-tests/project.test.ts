/// <reference types="vite/client" />

import { convexTest } from "convex-test"
import { expect, test } from "vitest"
import { api } from "../convex/_generated/api.js"
import schema from "../convex/schema.js"
import { apiKeyCredentialHash } from "../src/auth/model/apiKeyCredentialHash.ts"
import { projectUrlBuild } from "../src/project/url/projectUrlBuild.ts"

const modules = import.meta.glob("../convex/**/*.ts")
const timestamps = { createdAt: "2026-10-13T00:00:00.000Z", updatedAt: "2026-10-13T00:00:00.000Z" }

async function projectFixtureCreate() {
  const t = convexTest(schema, modules)
  const token = "a".repeat(64)
  const otherToken = "b".repeat(64)
  const digests = await Promise.all([token, otherToken].map(apiKeyCredentialHash))
  const parents = await t.run(async (ctx) => {
    for (const [index, credential] of [token, otherToken].entries()) {
      const userId = await ctx.db.insert("users", { name: `User ${index}`, role: "user", ...timestamps })
      await ctx.db.insert("authApiKeys", {
        userId,
        name: "Project test",
        digest: digests[index]!,
        previewFirst3: credential.slice(0, 3),
        previewLast3: credential.slice(-3),
        createdAt: timestamps.createdAt,
      })
    }
    const orgId = await ctx.db.insert("orgs", { orgHandle: "project-org", ...timestamps })
    const otherOrgId = await ctx.db.insert("orgs", { orgHandle: "other-org", ...timestamps })
    const teamId = await ctx.db.insert("teams", { orgId, name: "Alpha Team", ...timestamps })
    const otherTeamId = await ctx.db.insert("teams", { orgId: otherOrgId, name: "Beta Team", ...timestamps })
    const missingTeamId = await ctx.db.insert("teams", { orgId, name: "Removed Team", ...timestamps })
    await ctx.db.delete("teams", missingTeamId)
    return { orgId, otherOrgId, teamId, otherTeamId, missingTeamId }
  })
  return { t, token, otherToken, ...parents }
}

test("any authenticated user can create, read and edit projects without membership restrictions", async () => {
  const { t, token, otherToken, orgId, teamId } = await projectFixtureCreate()
  const created = await t.mutation(api.project.projectCreateMutation, {
    token,
    teamId,
    orgHandle: "project-org",
    name: "  First project  ",
    description: "  Project description  ",
  })
  expect(created.success).toBe(true)
  if (!created.success) throw new Error("Project fixture creation failed")
  const projectId = created.data
  const before = await t.query(api.project.projectGetQuery, { token: otherToken, projectId, teamId, orgId })
  expect(before).toMatchObject({
    success: true,
    data: {
      projectId,
      teamId,
      orgId,
      name: "First project",
      description: "Project description",
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    },
  })
  expect(
    await t.mutation(api.project.projectEditMutation, { token: otherToken, projectId, name: "Renamed project" }),
  ).toEqual({
    success: true,
    data: null,
  })
  const after = await t.query(api.project.projectGetQuery, { token, projectId, orgHandle: "project-org" })
  expect(after).toMatchObject({
    success: true,
    data: { projectId, teamId, orgId, name: "Renamed project" },
  })
  if (!before.success || !after.success) throw new Error("Project lookup failed")
  expect(after.data.createdAt).toBe(before.data.createdAt)
  expect(after.data).not.toHaveProperty("description")
  expect(await t.query(api.project.projectListQuery, { token: otherToken, teamId })).toMatchObject({
    success: true,
    data: { page: [after.data], isDone: true },
  })
})

test("all public project operations reject missing and invalid credentials without changing data", async () => {
  const { t, token, teamId } = await projectFixtureCreate()
  const created = await t.mutation(api.project.projectCreateMutation, { token, teamId, name: "Original" })
  if (!created.success) throw new Error("Project fixture creation failed")
  for (const invalidToken of ["", "not-a-credential"]) {
    expect(
      await t.mutation(api.project.projectCreateMutation, { token: invalidToken, teamId, name: "Unauthorized" }),
    ).toMatchObject({ success: false })
    expect(
      await t.mutation(api.project.projectEditMutation, {
        token: invalidToken,
        projectId: created.data,
        name: "Unauthorized",
      }),
    ).toMatchObject({ success: false })
    expect(await t.query(api.project.projectGetQuery, { token: invalidToken, projectId: created.data })).toMatchObject({
      success: false,
    })
    expect(await t.query(api.project.projectListQuery, { token: invalidToken })).toMatchObject({ success: false })
  }
  expect(await t.query(api.project.projectListQuery, { token, teamId })).toMatchObject({
    success: true,
    data: { page: [{ name: "Original" }], isDone: true },
  })
})

test("project mutations validate names, descriptions, immutable parents and ancestry context", async () => {
  const { t, token, orgId, otherOrgId, teamId, otherTeamId, missingTeamId } = await projectFixtureCreate()
  for (const args of [
    { teamId: missingTeamId, name: "Missing parent" },
    { teamId, orgHandle: "unknown-org", name: "Missing handle" },
    { teamId, orgId: otherOrgId, name: "Wrong org context" },
    { teamId, name: "   " },
    { teamId, name: "n".repeat(101) },
    { teamId, name: "Valid", description: "d".repeat(5001) },
  ]) {
    expect(await t.mutation(api.project.projectCreateMutation, { token, ...args })).toMatchObject({ success: false })
  }
  const created = await t.mutation(api.project.projectCreateMutation, { token, teamId, name: "Original" })
  if (!created.success) throw new Error("Project fixture creation failed")
  for (const context of [{ teamId: otherTeamId }, { orgId: otherOrgId }, { orgHandle: "other-org" }]) {
    expect(await t.query(api.project.projectGetQuery, { token, projectId: created.data, ...context })).toMatchObject({
      success: false,
    })
    expect(
      await t.mutation(api.project.projectEditMutation, {
        token,
        projectId: created.data,
        name: "Reparented",
        ...context,
      }),
    ).toMatchObject({ success: false })
  }
  expect(
    await t.mutation(api.project.projectEditMutation, { token, projectId: created.data, name: " " }),
  ).toMatchObject({
    success: false,
  })
  expect(await t.query(api.project.projectGetQuery, { token, projectId: created.data })).toMatchObject({
    success: true,
    data: { name: "Original", teamId, orgId },
  })
  // Deleting the parent team breaks ancestry check
  await t.run((ctx) => ctx.db.delete("teams", teamId))
  expect(await t.query(api.project.projectGetQuery, { token, projectId: created.data })).toMatchObject({
    success: false,
  })
  expect(
    await t.mutation(api.project.projectEditMutation, { token, projectId: created.data, name: "Orphan edit" }),
  ).toMatchObject({ success: false })
  expect(await t.query(api.project.projectListQuery, { token, teamId })).toMatchObject({ success: false })
})

test("project detail and edit return Results for a nonexistent stable project ID", async () => {
  const { t, token, teamId, orgId } = await projectFixtureCreate()
  const projectId = await t.run(async (ctx) => {
    const id = await ctx.db.insert("projects", { teamId, orgId, name: "Removed", ...timestamps })
    await ctx.db.delete("projects", id)
    return id
  })
  expect(await t.query(api.project.projectGetQuery, { token, projectId })).toMatchObject({ success: false })
  expect(await t.mutation(api.project.projectEditMutation, { token, projectId, name: "Missing" })).toMatchObject({
    success: false,
  })
})

test("project detail returns structured Result error for malformed project ID rather than throwing validator error", async () => {
  const { t, token } = await projectFixtureCreate()
  const result = await t.query(api.project.projectGetQuery, { token, projectId: "malformed-project-id" })
  expect(result).toMatchObject({
    success: false,
    errorMessage: "Project not found",
  })
})

test("project operations reject missing organizations and inconsistent stored ancestry", async () => {
  const { t, token, teamId, orgId, otherOrgId } = await projectFixtureCreate()
  const created = await t.mutation(api.project.projectCreateMutation, { token, teamId, name: "Original" })
  if (!created.success) throw new Error("Project fixture creation failed")
  await t.run((ctx) => ctx.db.patch("projects", created.data, { orgId: otherOrgId }))
  expect(await t.query(api.project.projectGetQuery, { token, projectId: created.data })).toMatchObject({
    success: false,
  })
  expect(await t.query(api.project.projectListQuery, { token })).toMatchObject({ success: false })
  expect(await t.query(api.project.projectListQuery, { token, orgId: otherOrgId })).toMatchObject({ success: false })
  await t.run(async (ctx) => {
    await ctx.db.patch("projects", created.data, { orgId })
    await ctx.db.delete("orgs", orgId)
  })
  expect(await t.mutation(api.project.projectCreateMutation, { token, teamId, name: "Orphan" })).toMatchObject({
    success: false,
  })
  expect(
    await t.mutation(api.project.projectEditMutation, { token, projectId: created.data, name: "Orphan" }),
  ).toMatchObject({ success: false })
  expect(await t.query(api.project.projectGetQuery, { token, projectId: created.data })).toMatchObject({
    success: false,
  })
  expect(await t.query(api.project.projectListQuery, { token })).toMatchObject({ success: false })
  expect(await t.query(api.project.projectListQuery, { token, orgId })).toMatchObject({ success: false })
})

test("project lists validate empty parent contexts and organization scope spans teams", async () => {
  const { t, token, teamId, orgId, otherOrgId, missingTeamId } = await projectFixtureCreate()
  const projects = await t.run(async (ctx) => {
    const siblingTeamId = await ctx.db.insert("teams", { orgId, name: "Sibling", ...timestamps })
    const first = await ctx.db.insert("projects", { teamId, orgId, name: "First", ...timestamps })
    const second = await ctx.db.insert("projects", { teamId: siblingTeamId, orgId, name: "Second", ...timestamps })
    return [first, second]
  })
  const result = await t.query(api.project.projectListQuery, { token, orgHandle: "project-org" })
  if (!result.success) throw new Error("Organization project list failed")
  expect(result.data.page.map((project) => project.projectId)).toEqual(projects)
  expect(result.data.isDone).toBe(true)
  for (const context of [
    { teamId: missingTeamId },
    { teamId, orgId: otherOrgId },
    { teamId, orgHandle: "other-org" },
    { orgHandle: "unknown-org" },
    { orgId, orgHandle: "other-org" },
  ]) {
    expect(await t.query(api.project.projectListQuery, { token, ...context })).toMatchObject({ success: false })
  }
})

test("indexed project queries support team, organization, and global queries with bounded cursor pagination", async () => {
  const { t, token, teamId, otherTeamId, orgId, otherOrgId } = await projectFixtureCreate()
  const expected = await t.run(async (ctx) => {
    const ids = []
    for (let index = 0; index < 105; index += 1) {
      ids.push(await ctx.db.insert("projects", { teamId, orgId, name: `Project ${index}`, ...timestamps }))
      await ctx.db.insert("projects", {
        teamId: otherTeamId,
        orgId: otherOrgId,
        name: `Other Project ${index}`,
        ...timestamps,
      })
    }
    return ids
  })
  const actual = []
  let cursor: string | null = null
  let isDone = false
  for (let index = 0; index < 10 && !isDone; index += 1) {
    const result = await t.query(api.project.projectListQuery, {
      token,
      teamId,
      paginationOpts: { numItems: 20, cursor },
    })
    if (!result.success) throw new Error("Project pagination failed")
    expect(result.data.page.length).toBeLessThanOrEqual(20)
    expect(result.data.page.every((project) => project.teamId === teamId && project.orgId === orgId)).toBe(true)
    actual.push(...result.data.page.map((project) => project.projectId))
    cursor = result.data.continueCursor
    isDone = result.data.isDone
  }
  expect(isDone).toBe(true)
  expect(actual).toEqual(expected)
  expect(new Set(actual).size).toBe(expected.length)

  // Org-scoped query
  const orgResult = await t.query(api.project.projectListQuery, {
    token,
    orgId,
    paginationOpts: { numItems: 50, cursor: null },
  })
  expect(orgResult.success).toBe(true)
  if (!orgResult.success) throw new Error("Org project pagination failed")
  expect(orgResult.data.page.every((project) => project.orgId === orgId)).toBe(true)

  // Global query
  const global = await t.query(api.project.projectListQuery, { token })
  expect(global).toMatchObject({ success: true, data: { isDone: false } })
  if (!global.success) throw new Error("Global project pagination failed")
  expect(global.data.page).toHaveLength(50)
  expect(new Set(global.data.page.map((p) => p.orgId))).toEqual(new Set([orgId, otherOrgId]))

  for (const numItems of [0, -1, 1.5, 101]) {
    expect(
      await t.query(api.project.projectListQuery, { token, paginationOpts: { numItems, cursor: null } }),
    ).toMatchObject({ success: false })
  }
  expect(
    await t.query(api.project.projectListQuery, { token, paginationOpts: { numItems: 10, cursor: "invalid-cursor" } }),
  ).toMatchObject({ success: false, op: "projectListQuery" })
})

test("project URL builders validate explicit hierarchy context", () => {
  expect(projectUrlBuild({ view: "list" })).toEqual({ success: true, data: "/project" })
  expect(projectUrlBuild({ view: "list", orgHandle: "my-org" })).toEqual({
    success: true,
    data: "/org/my-org/project",
  })
  expect(projectUrlBuild({ view: "list", teamId: "t1" })).toEqual({
    success: true,
    data: "/team/t1/project",
  })
  expect(projectUrlBuild({ view: "list", orgHandle: "my-org", teamId: "t1" })).toEqual({
    success: true,
    data: "/org/my-org/team/t1/project",
  })
  expect(projectUrlBuild({ view: "create", teamId: "t1" })).toEqual({
    success: true,
    data: "/team/t1/project/create",
  })
  expect(projectUrlBuild({ view: "create", orgHandle: "my-org", teamId: "t1" })).toEqual({
    success: true,
    data: "/org/my-org/team/t1/project/create",
  })
  // create without teamId fails validation
  expect(projectUrlBuild({ view: "create" })).toMatchObject({ success: false })
  expect(projectUrlBuild({ view: "detail", projectId: "p1" })).toEqual({
    success: true,
    data: "/project/p1",
  })
  expect(projectUrlBuild({ view: "detail", teamId: "t1", projectId: "p1" })).toEqual({
    success: true,
    data: "/team/t1/project/p1",
  })
  expect(projectUrlBuild({ view: "edit", orgHandle: "my-org", teamId: "t1", projectId: "p1" })).toEqual({
    success: true,
    data: "/org/my-org/team/t1/project/p1/edit",
  })
  expect(projectUrlBuild({ view: "edit", orgHandle: "my-org", teamId: "team/id", projectId: "project/id" })).toEqual({
    success: true,
    data: "/org/my-org/team/team%2Fid/project/project%2Fid/edit",
  })
  for (const input of [
    { view: "create", orgHandle: "my-org" },
    { view: "detail" },
    { view: "edit", projectId: " " },
    { view: "list", teamId: " " },
    { view: "list", orgHandle: "invalid/org" },
    { view: "unknown" },
  ]) {
    expect(projectUrlBuild(input)).toMatchObject({ success: false })
  }
})
