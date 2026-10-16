/// <reference types="vite/client" />

import { convexTest } from "convex-test"
import { expect, test } from "vitest"
import { internal } from "../convex/_generated/api.js"
import schema from "../convex/schema.js"

const modules = import.meta.glob("../convex/**/*.ts")

test("userProjectionTeamsPatchInternalMutation updates team assignments while preserving other user projection fields", async () => {
  const t = convexTest(schema, modules)

  // Seed user projection with teams
  await t.run(async (ctx) => {
    await ctx.db.insert("userProjections", {
      userId: "u-patch-test",
      organizationId: "org-test",
      displayName: "Patched User",
      roles: ["admin", "member"],
      teamIds: ["team-to-delete", "team-stay"],
      syncedAt: "2026-10-14T00:00:00.000Z",
    })
  })

  // Run patch mutation removing team-to-delete
  const patchResult = await t.mutation(internal.userManagement.userProjectionTeamsPatchInternalMutation, {
    userId: "u-patch-test",
    teamIds: ["team-stay"],
    syncedAt: "2026-10-14T01:00:00.000Z",
  })

  expect(patchResult.success).toBe(true)
  if (!patchResult.success) return
  expect(patchResult.data.patched).toBe(true)
  expect(patchResult.data.userId).toBe("u-patch-test")

  // Verify DB state
  const updatedDoc = await t.run(async (ctx) => {
    return ctx.db
      .query("userProjections")
      .withIndex("userId", (q) => q.eq("userId", "u-patch-test"))
      .first()
  })

  expect(updatedDoc).toBeDefined()
  expect(updatedDoc?.teamIds).toEqual(["team-stay"])
  expect(updatedDoc?.displayName).toBe("Patched User")
  expect(updatedDoc?.roles).toEqual(["admin", "member"])
  expect(updatedDoc?.syncedAt).toBe("2026-10-14T01:00:00.000Z")
})

test("userProjectionTeamsPatchInternalMutation returns patched false when user projection does not exist", async () => {
  const t = convexTest(schema, modules)

  const patchResult = await t.mutation(internal.userManagement.userProjectionTeamsPatchInternalMutation, {
    userId: "non-existent-user",
    teamIds: ["team-stay"],
  })

  expect(patchResult.success).toBe(true)
  if (!patchResult.success) return
  expect(patchResult.data.patched).toBe(false)
  expect(patchResult.data.userId).toBe("non-existent-user")
})
