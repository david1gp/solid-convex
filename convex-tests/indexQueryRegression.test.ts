/// <reference types="vite/client" />

import { convexTest } from "convex-test"
import type { FunctionReturnType } from "convex/server"
import { expect, test, vi } from "vitest"
import { internal } from "../convex/_generated/api.js"
import type { Id } from "../convex/_generated/dataModel.js"
import type { MutationCtx } from "../convex/_generated/server.js"
import schema from "../convex/schema.js"
import { otpFindFn } from "../src/auth/convex/otp/otpFindFn.ts"
import { otpRemovePreviousFn } from "../src/auth/convex/otp/otpRemovePrevious.ts"
import { week1timeMs } from "../src/auth/convex/otp/week1timeMs.ts"
import { userDeleteHardOtps as userDeleteHardNestedOtps } from "../src/auth/convex/user/delete/delete_hard/userDeleteHardOtps.ts"
import { userDeleteHardOtps } from "../src/auth/convex/user/delete_hard/userDeleteHardOtps.ts"
import { userDeleteHardEmailLoginCodes } from "../src/auth/convex/user/delete_hard_parts/userDeleteHardEmailLoginCodes.ts"
import { userDeleteHardFiles } from "../src/auth/convex/user/delete_hard_parts/userDeleteHardFiles.ts"
import { userDeleteHardOrgMemberships } from "../src/auth/convex/user/delete_hard_parts/userDeleteHardOrgMemberships.ts"
import { orgLeaveFn } from "../src/org/member_convex/orgLeaveMutation.ts"

const modules = import.meta.glob("../convex/**/*.ts")
const createdAt = "2026-09-18T00:00:00.000Z"
const timestamps = { createdAt, updatedAt: createdAt }
const otpFields = {
  name: "Index regression",
  email: "index@example.com",
  code: "123456",
  purpose: "signIn",
  createdAt,
} as const

async function userInsert(ctx: MutationCtx, name: string) {
  return ctx.db.insert("users", { name, role: "user", ...timestamps })
}

test("OTP lookup ignores wrong email, code, purpose and consumed rows and preserves the first matching record", async () => {
  const t = convexTest(schema, modules)
  const ids = await t.run(async (ctx) => {
    const userId = await userInsert(ctx, "OTP owner")
    await ctx.db.insert("authOtps", { ...otpFields, userId, email: "other@example.com" })
    await ctx.db.insert("authOtps", { ...otpFields, userId, code: "654321" })
    await ctx.db.insert("authOtps", { ...otpFields, userId, purpose: "signUp" })
    await ctx.db.insert("authOtps", { ...otpFields, userId, consumedAt: createdAt })
    const first = await ctx.db.insert("authOtps", { ...otpFields, userId })
    // The first match is determined by insertion order, not the application's createdAt field.
    const second = await ctx.db.insert("authOtps", {
      ...otpFields,
      userId,
      createdAt: "2020-01-01T00:00:00.000Z",
    })
    return { first, second }
  })
  const args = { email: otpFields.email, code: otpFields.code, purpose: otpFields.purpose }
  const before = await t.run((ctx) => ctx.db.query("authOtps").take(20))

  expect(await t.run((ctx) => otpFindFn(ctx, args))).toEqual({
    success: true,
    data: before.find((row) => row._id === ids.first),
  })
  expect(await t.run((ctx) => ctx.db.query("authOtps").take(20))).toEqual(before)

  await t.run((ctx) => ctx.db.patch("authOtps", ids.first, { consumedAt: createdAt }))
  expect(await t.run((ctx) => otpFindFn(ctx, args))).toMatchObject({
    success: true,
    data: { _id: ids.second },
  })
  await t.run((ctx) => ctx.db.patch("authOtps", ids.second, { consumedAt: createdAt }))
  expect(await t.run((ctx) => otpFindFn(ctx, args))).toMatchObject({ success: false })
})

test("OTP replacement removes every exact unconsumed user/email/purpose match and preserves all near-misses", async () => {
  const t = convexTest(schema, modules)
  const fixture = await t.run(async (ctx) => {
    const userId = await userInsert(ctx, "Replacement owner")
    const otherUserId = await userInsert(ctx, "Other owner")
    const base = { ...otpFields, userId }
    const removed = [
      await ctx.db.insert("authOtps", base),
      await ctx.db.insert("authOtps", { ...base, code: "654321" }),
    ]
    await ctx.db.insert("authOtps", { ...base, email: "other@example.com" })
    await ctx.db.insert("authOtps", { ...base, purpose: "emailChange" })
    await ctx.db.insert("authOtps", { ...base, consumedAt: createdAt })
    await ctx.db.insert("authOtps", { ...base, userId: otherUserId })
    return { userId, removed, before: await ctx.db.query("authOtps").take(20) }
  })

  await t.run((ctx) =>
    otpRemovePreviousFn(ctx, { userId: fixture.userId, email: otpFields.email, purpose: otpFields.purpose }),
  )

  expect(await t.run((ctx) => ctx.db.query("authOtps").take(20))).toEqual(
    fixture.before.filter((row) => !fixture.removed.includes(row._id)),
  )
})

async function hardDeleteOtpInsert(ctx: MutationCtx, userId: Id<"users">, consumed: boolean) {
  return ctx.db.insert("authOtps", {
    ...otpFields,
    userId,
    ...(consumed ? { consumedAt: createdAt, purpose: "passwordChange" as const } : {}),
  })
}

async function hardDeleteEmailCodeInsert(ctx: MutationCtx, userId: Id<"users">, consumed: boolean) {
  return ctx.db.insert("authEmailLoginCodes", {
    userId,
    email: otpFields.email,
    code: otpFields.code,
    createdAt,
    ...(consumed ? { consumedAt: createdAt } : {}),
  })
}

async function hardDeleteFileInsert(ctx: MutationCtx, userId: Id<"users">, deleted: boolean) {
  return ctx.db.insert("files", {
    userId,
    fileId: "shared-file-id",
    displayName: "regression.txt",
    fileSize: 10,
    contentType: "text/plain",
    url: "https://example.com/regression.txt",
    ...timestamps,
    ...(deleted ? { deletedAt: createdAt } : {}),
  })
}

const hardDeleteCases = [
  { label: "nested OTP helper", table: "authOtps", remove: userDeleteHardNestedOtps, insert: hardDeleteOtpInsert },
  { label: "OTP helper", table: "authOtps", remove: userDeleteHardOtps, insert: hardDeleteOtpInsert },
  {
    label: "email login codes",
    table: "authEmailLoginCodes",
    remove: userDeleteHardEmailLoginCodes,
    insert: hardDeleteEmailCodeInsert,
  },
  { label: "files", table: "files", remove: userDeleteHardFiles, insert: hardDeleteFileInsert },
] as const

test.each(hardDeleteCases.flatMap((entry) => [0, 1].map((ownerIndex) => ({ ...entry, ownerIndex }))))(
  "hard deletion via $label removes only userId at position $ownerIndex, including consumed/deleted rows",
  async ({ table, remove, insert, ownerIndex }) => {
    const t = convexTest(schema, modules)
    const fixture = await t.run(async (ctx) => {
      const users = [await userInsert(ctx, "First owner"), await userInsert(ctx, "Second owner")] as const
      for (const userId of users) {
        await insert(ctx, userId, false)
        await insert(ctx, userId, true)
      }
      const target = users[ownerIndex]!
      return { target, before: await ctx.db.query(table).take(20) }
    })

    await t.run((ctx) => remove(ctx, fixture.target))

    const remaining = await t.run((ctx) => ctx.db.query(table).take(20))
    expect(remaining).toEqual(fixture.before.filter((row) => row.userId !== fixture.target))
    expect(remaining).toHaveLength(2)
    expect(await t.run((ctx) => ctx.db.get("users", fixture.target))).not.toBeNull()
  },
)

test.each([0, 1])(
  "membership hard deletion isolates both userId and invitedBy for user at position %i",
  async (ownerIndex) => {
    const t = convexTest(schema, modules)
    const fixture = await t.run(async (ctx) => {
      const users = [await userInsert(ctx, "First inviter"), await userInsert(ctx, "Second inviter")] as const
      for (const orgHandle of ["first-org", "second-org"]) {
        const orgId = await ctx.db.insert("orgs", { orgHandle, ...timestamps })
        for (const userId of users) {
          await ctx.db.insert("orgMembers", {
            orgId,
            orgHandle,
            userId,
            invitedBy: users[1 - users.indexOf(userId)]!,
            role: "member",
            ...timestamps,
          })
          await ctx.db.insert("orgInvitations", {
            orgHandle,
            invitationCode: `${orgHandle}-${userId}`,
            invitedName: "Invitee",
            invitedEmail: otpFields.email,
            invitedBy: userId,
            role: "guest",
            l: "en",
            emailSendAmount: 0,
            ...timestamps,
          })
        }
      }
      await ctx.db.insert("orgInvitations", {
        orgHandle: "first-org",
        invitationCode: "already-cleared",
        invitedName: "Invitee",
        invitedEmail: otpFields.email,
        invitedBy: "",
        role: "guest",
        l: "en",
        emailSendAmount: 0,
        ...timestamps,
      })
      return {
        target: users[ownerIndex]!,
        members: await ctx.db.query("orgMembers").take(20),
        invitations: await ctx.db.query("orgInvitations").take(20),
        orgs: await ctx.db.query("orgs").take(20),
      }
    })

    await t.run((ctx) => userDeleteHardOrgMemberships(ctx, fixture.target))

    expect(await t.run((ctx) => ctx.db.query("orgMembers").take(20))).toEqual(
      fixture.members.filter((row) => row.userId !== fixture.target),
    )
    expect(await t.run((ctx) => ctx.db.query("orgInvitations").take(20))).toEqual(
      fixture.invitations.map((row) => (row.invitedBy === fixture.target ? { ...row, invitedBy: "" } : row)),
    )
    expect(await t.run((ctx) => ctx.db.query("orgs").take(20))).toEqual(fixture.orgs)
  },
)

test.each([
  {
    label: "email login",
    table: "authEmailLoginCodes",
    mutation: internal.auth.signInViaEmailEnterOtp3CleanupOldCodesInternalMutation,
  },
  {
    label: "email registration",
    table: "authUserEmailRegistrations",
    mutation: internal.auth.signUpConfirmEmail3CleanupOldCodesInternalMutation,
  },
] as const)(
  "$label cleanup uses a strict seven-day lt boundary regardless of insertion order or consumed state",
  async ({ table, mutation }) => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-10-01T12:00:00.000Z"))

    try {
      const t = convexTest(schema, modules)
      const cutoff = Date.now() - week1timeMs
      const fixture = await t.run(async (ctx) => {
        const userId = await userInsert(ctx, "Cleanup owner")
        const offsets = [1, -1, 0, -2]
        for (const offset of offsets) {
          const fields = {
            email: otpFields.email,
            code: otpFields.code,
            createdAt: new Date(cutoff + offset).toISOString(),
            ...(offset === -2 ? { consumedAt: createdAt } : {}),
          }
          if (table === "authEmailLoginCodes") {
            await ctx.db.insert(table, { ...fields, userId })
          } else {
            await ctx.db.insert(table, { ...fields, name: "Cleanup registration" })
          }
        }
        // Login cleanup also invokes the bounded OTP cleanup helper.
        for (const offset of [1, -1, 0]) {
          await ctx.db.insert("authOtps", {
            ...otpFields,
            userId,
            createdAt: new Date(cutoff + offset).toISOString(),
          })
        }
        return {
          codes: await ctx.db.query(table).take(20),
          otps: await ctx.db.query("authOtps").take(20),
        }
      })

      expect(await t.mutation(mutation, {})).toEqual({ deleted: table === "authEmailLoginCodes" ? 3 : 2 })

      const cutoffIso = new Date(cutoff).toISOString()
      expect(await t.run((ctx) => ctx.db.query(table).take(20))).toEqual(
        fixture.codes.filter((row) => row.createdAt >= cutoffIso),
      )
      expect(await t.run((ctx) => ctx.db.query("authOtps").take(20))).toEqual(
        table === "authEmailLoginCodes" ? fixture.otps.filter((row) => row.createdAt >= cutoffIso) : fixture.otps,
      )
    } finally {
      vi.useRealTimers()
    }
  },
)

test("resource/file removal deletes all duplicate exact pairs and leaves both one-field near-misses untouched", async () => {
  const t = convexTest(schema, modules)
  const before = await t.run(async (ctx) => {
    for (const [resourceId, fileId] of [
      ["target-resource", "target-file"],
      ["target-resource", "other-file"],
      ["other-resource", "target-file"],
      ["target-resource", "target-file"],
      ["other-resource", "other-file"],
      ["target-resource", "target-file"],
    ]) {
      await ctx.db.insert("resourceFiles", { resourceId: resourceId!, fileId: fileId!, createdAt })
    }
    return ctx.db.query("resourceFiles").take(20)
  })

  expect(
    await t.mutation(internal.resource.resourceFileRemoveInternalMutation, {
      resourceId: "target-resource",
      fileId: "target-file",
    }),
  ).toBeNull()
  expect(await t.run((ctx) => ctx.db.query("resourceFiles").take(20))).toEqual(
    before.filter((row) => row.resourceId !== "target-resource" || row.fileId !== "target-file"),
  )
})

test.each([false, true])(
  "organization/resource removal deletes all duplicate exact pairs (supplied orgId: %s)",
  async (supplyOrgId) => {
    const t = convexTest(schema, modules)
    const fixture = await t.run(async (ctx) => {
      const orgId = await ctx.db.insert("orgs", { orgHandle: "target-org", ...timestamps })
      const otherOrgId = await ctx.db.insert("orgs", { orgHandle: "other-org", ...timestamps })
      for (const [orgHandle, resourceId] of [
        ["target-org", "target-resource"],
        ["target-org", "other-resource"],
        ["other-org", "target-resource"],
        ["target-org", "target-resource"],
        ["other-org", "other-resource"],
        ["target-org", "target-resource"],
      ]) {
        await ctx.db.insert("orgResources", {
          orgId: orgHandle === "target-org" ? orgId : otherOrgId,
          orgHandle: orgHandle!,
          resourceId: resourceId!,
          createdAt,
        })
      }
      return { orgId, before: await ctx.db.query("orgResources").take(20) }
    })

    expect(
      await t.mutation(internal.org.orgResourceRemoveInternalMutation, {
        orgHandle: "target-org",
        resourceId: "target-resource",
        ...(supplyOrgId ? { orgId: fixture.orgId } : {}),
      }),
    ).toEqual({ success: true, data: null })
    expect(await t.run((ctx) => ctx.db.query("orgResources").take(20))).toEqual(
      fixture.before.filter((row) => row.orgHandle !== "target-org" || row.resourceId !== "target-resource"),
    )
  },
)

test("unfiltered resource listing paginates the live deletedAt index in creation order, not resourceId or createdAt order", async () => {
  const t = convexTest(schema, modules)
  const expected = ["z-first", "a-second", "m-third", "b-fourth", "y-fifth"]
  await t.run(async (ctx) => {
    for (let index = 0; index < expected.length; index += 1) {
      const time = new Date(Date.parse(createdAt) - index * 1000).toISOString()
      await ctx.db.insert("resources", {
        resourceId: `tombstone-${index}`,
        ...timestamps,
        deletedAt: createdAt,
      })
      await ctx.db.insert("resources", { resourceId: expected[index]!, createdAt: time, updatedAt: time })
    }
    await ctx.db.insert("resources", { resourceId: "trailing-tombstone", ...timestamps, deletedAt: createdAt })
  })

  const pages: string[][] = []
  let cursor: string | null = null
  for (let index = 0; index < 3; index += 1) {
    const result: FunctionReturnType<typeof internal.resource.resourcesListInternalQuery> = await t.query(
      internal.resource.resourcesListInternalQuery,
      {
        // Whitespace search must use the ordinary live-resource index too.
        searchText: index === 0 ? "   " : undefined,
        paginationOpts: { numItems: 2, cursor },
      },
    )
    pages.push(result.page.map((row) => row.resourceId))
    expect(result.isDone).toBe(index === 2)
    if (!result.isDone) expect(result.continueCursor).not.toBe(cursor)
    cursor = result.continueCursor
  }
  expect(pages).toEqual([expected.slice(0, 2), expected.slice(2, 4), expected.slice(4)])
})

const resourceFilterCases = [
  {
    label: "no optional filters",
    filters: {},
    expected: ["match", "wrong-type", "wrong-visibility", "wrong-language", "missing-fields"],
  },
  { label: "type", filters: { type: "report" }, expected: ["match", "wrong-visibility", "wrong-language"] },
  { label: "visibility", filters: { visibility: "public" }, expected: ["match", "wrong-type", "wrong-language"] },
  { label: "language", filters: { l: "en" }, expected: ["match", "wrong-type", "wrong-visibility"] },
  { label: "all optional filters", filters: { type: "report", visibility: "public", l: "en" }, expected: ["match"] },
] as const

async function resourceSearchFixtureInsert(ctx: MutationCtx) {
  const fields = {
    ...timestamps,
    searchText: "needle indexed regression",
    type: "report",
    visibility: "public",
    language: "en",
  } as const
  const rows = [
    { ...fields, resourceId: "match" },
    { ...fields, resourceId: "wrong-type", type: "training" as const },
    { ...fields, resourceId: "wrong-visibility", visibility: "org" as const },
    { ...fields, resourceId: "wrong-language", language: "ru" as const },
    { ...timestamps, resourceId: "missing-fields", searchText: fields.searchText },
    { ...fields, resourceId: "wrong-search", searchText: "unrelated document" },
    { ...fields, resourceId: "tombstone", deletedAt: createdAt },
  ]
  for (const row of rows) await ctx.db.insert("resources", row)
}

test.each(resourceFilterCases)(
  "resource search excludes tombstones and applies $label inside the search index",
  async ({ filters, expected }) => {
    const t = convexTest(schema, modules)
    await t.run(resourceSearchFixtureInsert)

    const result = await t.query(internal.resource.resourcesListInternalQuery, {
      ...filters,
      searchText: "  needle  ",
      paginationOpts: { numItems: 20, cursor: null },
    })

    expect(result.isDone).toBe(true)
    // Search relevance order is not part of the contract.
    expect(result.page.map((row) => row.resourceId).sort()).toEqual([...expected].sort())
    expect(result.page.every((row) => row.deletedAt === undefined)).toBe(true)
    expect(result.page.every((row) => !("searchText" in row) && !("_id" in row) && !("_creationTime" in row))).toBe(
      true,
    )
  },
)

test.each(resourceFilterCases.slice(1))(
  "ordinary resource listing preserves tombstone exclusion with $label",
  async ({ filters, expected }) => {
    const t = convexTest(schema, modules)
    await t.run(resourceSearchFixtureInsert)

    const result = await t.query(internal.resource.resourcesListInternalQuery, {
      ...filters,
      paginationOpts: { numItems: 20, cursor: null },
    })

    expect(result.isDone).toBe(true)
    expect(result.page.map((row) => row.resourceId)).toEqual([...expected, "wrong-search"])
  },
)

test("organization leave uses the exact userId/orgId pair, preserves near-misses and removes only the first duplicate", async () => {
  const t = convexTest(schema, modules)
  const fixture = await t.run(async (ctx) => {
    const userId = await userInsert(ctx, "Departing member")
    const otherUserId = await userInsert(ctx, "Remaining member")
    const orgId = await ctx.db.insert("orgs", { orgHandle: "leave-org", ...timestamps })
    const otherOrgId = await ctx.db.insert("orgs", { orgHandle: "other-org", ...timestamps })
    const fields = { orgHandle: "leave-org", role: "member", invitedBy: otherUserId, ...timestamps } as const
    await ctx.db.insert("orgMembers", { ...fields, userId, orgId: otherOrgId })
    await ctx.db.insert("orgMembers", { ...fields, userId: otherUserId, orgId })
    return { userId, orgId, fields, before: await ctx.db.query("orgMembers").take(20) }
  })
  const args = { userId: fixture.userId, orgHandle: "leave-org" }

  expect(await t.run((ctx) => orgLeaveFn(ctx, args))).toMatchObject({
    success: false,
    errorMessage: "Member not found",
  })
  expect(await t.run((ctx) => ctx.db.query("orgMembers").take(20))).toEqual(fixture.before)

  const matching = await t.run(async (ctx) => {
    const first = await ctx.db.insert("orgMembers", { ...fixture.fields, userId: fixture.userId, orgId: fixture.orgId })
    await ctx.db.insert("orgMembers", { ...fixture.fields, userId: fixture.userId, orgId: fixture.orgId })
    // A dangling membership lets the helper stop at its missing-user guard, before session/JWT creation.
    await ctx.db.delete("users", fixture.userId)
    return { first, before: await ctx.db.query("orgMembers").take(20) }
  })

  expect(await t.run((ctx) => orgLeaveFn(ctx, args))).toMatchObject({ success: false, errorMessage: "User not found" })
  expect(await t.run((ctx) => ctx.db.query("orgMembers").take(20))).toEqual(
    matching.before.filter((row) => row._id !== matching.first),
  )
  expect(await t.run((ctx) => ctx.db.get("orgs", fixture.orgId))).not.toBeNull()
  expect(await t.run((ctx) => ctx.db.query("authSessions").take(1))).toEqual([])
})
