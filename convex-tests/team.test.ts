/// <reference types="vite/client" />

import { convexTest } from "convex-test"
import { expect, test } from "vitest"
import { api } from "../convex/_generated/api.js"
import schema from "../convex/schema.js"
import { apiKeyCredentialHash } from "../src/auth/model/apiKeyCredentialHash.ts"
import { teamUrlBuild } from "../src/team/url/teamUrlBuild.ts"

const modules = import.meta.glob("../convex/**/*.ts")
const timestamps = { createdAt: "2026-10-13T00:00:00.000Z", updatedAt: "2026-10-13T00:00:00.000Z" }

async function teamFixtureCreate() {
  const t = convexTest(schema, modules)
  const token = "a".repeat(64)
  const otherToken = "b".repeat(64)
  const digests = await Promise.all([token, otherToken].map(apiKeyCredentialHash))
  const parents = await t.run(async (ctx) => {
    for (const [index, credential] of [token, otherToken].entries()) {
      const userId = await ctx.db.insert("users", { name: `User ${index}`, role: "user", ...timestamps })
      await ctx.db.insert("authApiKeys", {
        userId,
        name: "Team test",
        digest: digests[index]!,
        previewFirst3: credential.slice(0, 3),
        previewLast3: credential.slice(-3),
        createdAt: timestamps.createdAt,
      })
    }
    const orgId = await ctx.db.insert("orgs", { orgHandle: "team-org", ...timestamps })
    const otherOrgId = await ctx.db.insert("orgs", { orgHandle: "other-org", ...timestamps })
    const missingOrgId = await ctx.db.insert("orgs", { orgHandle: "removed-org", ...timestamps })
    await ctx.db.delete("orgs", missingOrgId)
    return { orgId, otherOrgId, missingOrgId }
  })
  return { t, token, otherToken, ...parents }
}

test("any authenticated user can create, read and edit teams without organization membership", async () => {
  const { t, token, otherToken, orgId } = await teamFixtureCreate()
  const created = await t.mutation(api.team.teamCreateMutation, {
    token,
    orgHandle: "team-org",
    name: "  First team  ",
    description: "  Description  ",
  })
  expect(created.success).toBe(true)
  if (!created.success) throw new Error("Team fixture creation failed")
  const teamId = created.data
  const before = await t.query(api.team.teamGetQuery, { token: otherToken, teamId, orgId })
  expect(before).toMatchObject({
    success: true,
    data: {
      teamId,
      orgId,
      name: "First team",
      description: "Description",
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    },
  })
  expect(await t.mutation(api.team.teamEditMutation, { token: otherToken, teamId, name: "Renamed" })).toEqual({
    success: true,
    data: null,
  })
  const after = await t.query(api.team.teamGetQuery, { token, teamId, orgHandle: "team-org" })
  expect(after).toMatchObject({ success: true, data: { teamId, orgId, name: "Renamed" } })
  if (!before.success || !after.success) throw new Error("Team lookup failed")
  expect(after.data.createdAt).toBe(before.data.createdAt)
  expect(after.data).not.toHaveProperty("description")
  expect(await t.query(api.team.teamListQuery, { token: otherToken, orgId })).toMatchObject({
    success: true,
    data: { page: [after.data], isDone: true },
  })
})

test("all public team operations reject missing and invalid credentials without changing data", async () => {
  const { t, token, orgId } = await teamFixtureCreate()
  const created = await t.mutation(api.team.teamCreateMutation, { token, orgId, name: "Original" })
  if (!created.success) throw new Error("Team fixture creation failed")
  for (const invalidToken of ["", "not-a-credential"]) {
    expect(
      await t.mutation(api.team.teamCreateMutation, { token: invalidToken, orgId, name: "Unauthorized" }),
    ).toMatchObject({ success: false })
    expect(
      await t.mutation(api.team.teamEditMutation, { token: invalidToken, teamId: created.data, name: "Unauthorized" }),
    ).toMatchObject({ success: false })
    expect(await t.query(api.team.teamGetQuery, { token: invalidToken, teamId: created.data })).toMatchObject({
      success: false,
    })
    expect(await t.query(api.team.teamListQuery, { token: invalidToken })).toMatchObject({ success: false })
  }
  expect(await t.query(api.team.teamListQuery, { token })).toMatchObject({
    success: true,
    data: { page: [{ name: "Original" }], isDone: true },
  })
})

test("team mutations validate names, descriptions and existing consistent parent organization context", async () => {
  const { t, token, orgId, otherOrgId, missingOrgId } = await teamFixtureCreate()
  for (const args of [
    { name: "No parent" },
    { orgId: missingOrgId, name: "Missing parent" },
    { orgHandle: "unknown-org", name: "Missing handle" },
    { orgId, orgHandle: "other-org", name: "Wrong context" },
    { orgId, name: "   " },
    { orgId, name: "n".repeat(101) },
    { orgId, name: "Valid", description: "d".repeat(5001) },
  ]) {
    expect(await t.mutation(api.team.teamCreateMutation, { token, ...args })).toMatchObject({ success: false })
  }
  const created = await t.mutation(api.team.teamCreateMutation, { token, orgId, name: "Original" })
  if (!created.success) throw new Error("Team fixture creation failed")
  for (const context of [{ orgId: otherOrgId }, { orgHandle: "other-org" }, { orgId: missingOrgId }]) {
    expect(await t.query(api.team.teamGetQuery, { token, teamId: created.data, ...context })).toMatchObject({
      success: false,
    })
    expect(
      await t.mutation(api.team.teamEditMutation, { token, teamId: created.data, name: "Reparented", ...context }),
    ).toMatchObject({ success: false })
  }
  expect(await t.mutation(api.team.teamEditMutation, { token, teamId: created.data, name: " " })).toMatchObject({
    success: false,
  })
  expect(await t.query(api.team.teamGetQuery, { token, teamId: created.data })).toMatchObject({
    success: true,
    data: { name: "Original", orgId },
  })
  await t.run((ctx) => ctx.db.delete("orgs", orgId))
  expect(await t.query(api.team.teamGetQuery, { token, teamId: created.data })).toMatchObject({ success: false })
  expect(
    await t.mutation(api.team.teamEditMutation, { token, teamId: created.data, name: "Orphan edit" }),
  ).toMatchObject({ success: false })
  expect(await t.query(api.team.teamListQuery, { token, orgId })).toMatchObject({ success: false })
})

test("team detail and edit return Results for a nonexistent stable team ID", async () => {
  const { t, token, orgId } = await teamFixtureCreate()
  const teamId = await t.run(async (ctx) => {
    const id = await ctx.db.insert("teams", { orgId, name: "Removed", ...timestamps })
    await ctx.db.delete("teams", id)
    return id
  })
  expect(await t.query(api.team.teamGetQuery, { token, teamId })).toMatchObject({ success: false })
  expect(await t.mutation(api.team.teamEditMutation, { token, teamId, name: "Missing" })).toMatchObject({
    success: false,
  })
})

test("team detail returns structured Result error for malformed team ID rather than throwing validator error", async () => {
  const { t, token } = await teamFixtureCreate()
  const result = await t.query(api.team.teamGetQuery, { token, teamId: "malformed-team-id" })
  expect(result).toMatchObject({
    success: false,
    errorMessage: "Team not found",
  })
})

test("indexed organization pages are bounded, complete, disjoint and exclude other organizations", async () => {
  const { t, token, orgId, otherOrgId, missingOrgId } = await teamFixtureCreate()
  const expected = await t.run(async (ctx) => {
    const ids = []
    for (let index = 0; index < 105; index += 1) {
      ids.push(await ctx.db.insert("teams", { orgId, name: `Team ${index}`, ...timestamps }))
      await ctx.db.insert("teams", { orgId: otherOrgId, name: `Other ${index}`, ...timestamps })
    }
    return ids
  })
  const actual = []
  let cursor: string | null = null
  let isDone = false
  for (let index = 0; index < 10 && !isDone; index += 1) {
    const result = await t.query(api.team.teamListQuery, {
      token,
      orgHandle: "team-org",
      paginationOpts: { numItems: 20, cursor },
    })
    if (!result.success) throw new Error("Team pagination failed")
    expect(result.data.page.length).toBeLessThanOrEqual(20)
    expect(result.data.page.every((team) => team.orgId === orgId)).toBe(true)
    actual.push(...result.data.page.map((team) => team.teamId))
    cursor = result.data.continueCursor
    isDone = result.data.isDone
  }
  expect(isDone).toBe(true)
  expect(actual).toEqual(expected)
  expect(new Set(actual).size).toBe(expected.length)
  const global = await t.query(api.team.teamListQuery, { token })
  expect(global).toMatchObject({ success: true, data: { isDone: false } })
  if (!global.success) throw new Error("Global team pagination failed")
  expect(global.data.page).toHaveLength(50)
  expect(new Set(global.data.page.map((team) => team.orgId))).toEqual(new Set([orgId, otherOrgId]))
  for (const numItems of [0, -1, 1.5, 101]) {
    expect(await t.query(api.team.teamListQuery, { token, paginationOpts: { numItems, cursor: null } })).toMatchObject({
      success: false,
    })
  }
  expect(
    await t.query(api.team.teamListQuery, { token, paginationOpts: { numItems: 10, cursor: "invalid-cursor" } }),
  ).toMatchObject({ success: false, op: "teamListQuery" })
  for (const context of [{ orgId: missingOrgId }, { orgHandle: "unknown-org" }, { orgId, orgHandle: "other-org" }]) {
    expect(await t.query(api.team.teamListQuery, { token, ...context })).toMatchObject({ success: false })
  }
})

test("team URL builders validate explicit organization and stable ID context", () => {
  expect(teamUrlBuild({ view: "list" })).toEqual({ success: true, data: "/team" })
  expect(teamUrlBuild({ view: "list", orgHandle: "team-org" })).toEqual({ success: true, data: "/org/team-org/team" })
  expect(teamUrlBuild({ view: "create", orgHandle: "team-org" })).toEqual({
    success: true,
    data: "/org/team-org/team/create",
  })
  expect(teamUrlBuild({ view: "detail", orgHandle: "team-org", teamId: "stable-id" })).toEqual({
    success: true,
    data: "/org/team-org/team/stable-id",
  })
  expect(teamUrlBuild({ view: "detail", teamId: "stable-id" })).toEqual({
    success: true,
    data: "/team/stable-id",
  })
  expect(teamUrlBuild({ view: "edit", orgHandle: "team-org", teamId: "stable/id" })).toEqual({
    success: true,
    data: "/org/team-org/team/stable%2Fid/edit",
  })
  expect(teamUrlBuild({ view: "edit", teamId: "stable/id" })).toEqual({
    success: true,
    data: "/team/stable%2Fid/edit",
  })
  for (const input of [{ view: "create" }, { view: "detail" }, { view: "edit" }]) {
    expect(teamUrlBuild(input)).toMatchObject({ success: false })
  }
})
