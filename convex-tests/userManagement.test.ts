/// <reference types="vite/client" />

import { convexTest } from "convex-test"
import { expect, test } from "vitest"
import { api, internal } from "../convex/_generated/api.js"
import schema from "../convex/schema.js"
import { apiKeyCredentialHash } from "../src/auth/model/apiKeyCredentialHash.ts"

const modules = import.meta.glob("../convex/**/*.ts")
const timestamps = {
  createdAt: "2026-10-14T00:00:00.000Z",
  updatedAt: "2026-10-14T00:00:00.000Z",
}

async function userManagementFixtureCreate() {
  const t = convexTest(schema, modules)
  const adminKey = "a".repeat(64)
  const regularKey = "b".repeat(64)
  const [adminDigest, regularDigest] = await Promise.all([
    apiKeyCredentialHash(adminKey),
    apiKeyCredentialHash(regularKey),
  ])

  const ids = await t.run(async (ctx) => {
    const adminUserId = await ctx.db.insert("users", {
      name: "Admin User",
      role: "admin",
      roles: ["admin"],
      ...timestamps,
    })
    await ctx.db.insert("authApiKeys", {
      userId: adminUserId,
      name: "Admin key",
      digest: adminDigest,
      previewFirst3: adminKey.slice(0, 3),
      previewLast3: adminKey.slice(-3),
      createdAt: timestamps.createdAt,
    })

    const regularUserId = await ctx.db.insert("users", {
      name: "Regular User",
      role: "user",
      roles: ["user"],
      ...timestamps,
    })
    await ctx.db.insert("authApiKeys", {
      userId: regularUserId,
      name: "Regular key",
      digest: regularDigest,
      previewFirst3: regularKey.slice(0, 3),
      previewLast3: regularKey.slice(-3),
      createdAt: timestamps.createdAt,
    })

    const orgId = await ctx.db.insert("orgs", {
      orgHandle: "test-org",
      ...timestamps,
    })

    const teamId = await ctx.db.insert("teams", {
      orgId,
      name: "Core Team",
      ...timestamps,
    })

    return { adminUserId, regularUserId, orgId, teamId }
  })

  return { t, adminKey, regularKey, ...ids }
}

test("user projection list query requires admin authorization from database", async () => {
  const { t, adminKey, regularKey } = await userManagementFixtureCreate()

  // Regular user is rejected
  const nonAdminResult = await t.query(api.userManagement.userProjectionListQuery, {
    token: regularKey,
  })
  expect(nonAdminResult.success).toBe(false)
  if (!nonAdminResult.success) {
    expect(nonAdminResult.errorMessage).toMatch(/Admin authorization required/i)
  }

  // Admin user is accepted
  const adminResult = await t.query(api.userManagement.userProjectionListQuery, {
    token: adminKey,
  })
  expect(adminResult.success).toBe(true)
  if (adminResult.success) {
    expect(adminResult.data.page).toEqual([])
  }
})

test("team validation internal query validates team existence", async () => {
  const { t, teamId } = await userManagementFixtureCreate()

  // Valid team ID passes
  const validResult = await t.query(internal.userManagement.userManagementTeamsValidateInternalQuery, {
    teamIds: [teamId],
  })
  expect(validResult.success).toBe(true)

  // Non-existent team ID fails
  const missingId = "jd700000000000000000000000000000"
  const invalidResult = await t.query(internal.userManagement.userManagementTeamsValidateInternalQuery, {
    teamIds: [missingId],
  })
  expect(invalidResult.success).toBe(false)
})

test("user projection upsert and reactive bounded query filter by organization", async () => {
  const { t, adminKey } = await userManagementFixtureCreate()

  // Upsert user projection 1 in org-a
  const upsert1 = await t.mutation(internal.userManagement.userProjectionUpsertInternalMutation, {
    userId: "zitadel-user-1",
    organizationId: "org-a",
    displayName: "Alice",
    roles: ["admin"],
    teamIds: [],
    syncedAt: "2026-10-14T00:00:00.000Z",
  })
  expect(upsert1.success).toBe(true)

  // Upsert user projection 2 in org-b
  const upsert2 = await t.mutation(internal.userManagement.userProjectionUpsertInternalMutation, {
    userId: "zitadel-user-2",
    organizationId: "org-b",
    displayName: "Bob",
    roles: ["member"],
    teamIds: [],
    syncedAt: "2026-10-14T00:00:00.000Z",
  })
  expect(upsert2.success).toBe(true)

  // Filter query by org-a returns only Alice
  const listOrgA = await t.query(api.userManagement.userProjectionListQuery, {
    token: adminKey,
    organizationId: "org-a",
  })
  expect(listOrgA.success).toBe(true)
  if (listOrgA.success) {
    expect(listOrgA.data.page.length).toBe(1)
    expect(listOrgA.data.page[0]?.userId).toBe("zitadel-user-1")
    expect(listOrgA.data.page[0]?.displayName).toBe("Alice")
  }

  // Filter query by org-b returns only Bob
  const listOrgB = await t.query(api.userManagement.userProjectionListQuery, {
    token: adminKey,
    organizationId: "org-b",
  })
  expect(listOrgB.success).toBe(true)
  if (listOrgB.success) {
    expect(listOrgB.data.page.length).toBe(1)
    expect(listOrgB.data.page[0]?.userId).toBe("zitadel-user-2")
    expect(listOrgB.data.page[0]?.displayName).toBe("Bob")
  }
})

test("complete sync cleans up stale records while partial sync preserves them", async () => {
  const { t } = await userManagementFixtureCreate()

  // Initial sync with two users in org-x
  await t.mutation(internal.userManagement.userProjectionSyncRecordsInternalMutation, {
    organizationId: "org-x",
    records: [
      {
        userId: "u1",
        organizationId: "org-x",
        displayName: "User One",
        roles: ["user"],
        teamIds: [],
        syncedAt: "2026-10-14T00:00:00.000Z",
      },
      {
        userId: "u2",
        organizationId: "org-x",
        displayName: "User Two",
        roles: ["user"],
        teamIds: [],
        syncedAt: "2026-10-14T00:00:00.000Z",
      },
    ],
    isCompleteSync: false,
  })

  // Partial sync containing only u1 (isCompleteSync: false) must NOT delete u2
  const partialSync = await t.mutation(internal.userManagement.userProjectionSyncRecordsInternalMutation, {
    organizationId: "org-x",
    records: [
      {
        userId: "u1",
        organizationId: "org-x",
        displayName: "User One Updated",
        roles: ["user"],
        teamIds: [],
        syncedAt: "2026-10-14T01:00:00.000Z",
      },
    ],
    isCompleteSync: false,
  })
  expect(partialSync.success).toBe(true)
  if (partialSync.success) {
    expect(partialSync.data.deletedStaleCount).toBe(0)
  }

  // Verify both u1 and u2 still exist in DB
  const countAfterPartial = await t.run((ctx) =>
    ctx.db
      .query("userProjections")
      .withIndex("organizationId", (q) => q.eq("organizationId", "org-x"))
      .collect(),
  )
  expect(countAfterPartial.length).toBe(2)

  // Complete sync containing only u1 (isCompleteSync: true) deletes stale u2
  const completeSync = await t.mutation(internal.userManagement.userProjectionSyncRecordsInternalMutation, {
    organizationId: "org-x",
    records: [
      {
        userId: "u1",
        organizationId: "org-x",
        displayName: "User One Final",
        roles: ["user"],
        teamIds: [],
        syncedAt: "2026-10-14T02:00:00.000Z",
      },
    ],
    isCompleteSync: true,
  })
  expect(completeSync.success).toBe(true)
  if (completeSync.success) {
    expect(completeSync.data.deletedStaleCount).toBe(1)
  }

  // Verify only u1 remains
  const countAfterComplete = await t.run((ctx) =>
    ctx.db
      .query("userProjections")
      .withIndex("organizationId", (q) => q.eq("organizationId", "org-x"))
      .collect(),
  )
  expect(countAfterComplete.length).toBe(1)
  expect(countAfterComplete[0]?.userId).toBe("u1")
})

test("canonical role revocation immediately updates local auth user without waiting for login", async () => {
  const { t, adminUserId } = await userManagementFixtureCreate()

  // Link OIDC account to admin user
  await t.run(async (ctx) => {
    await ctx.db.insert("authAccounts", {
      userId: adminUserId,
      provider: "oidc",
      providerAccountId: "zitadel-admin-sub",
      ...timestamps,
    })
  })

  // Verify initial state is admin
  const userBefore = await t.run((ctx) => ctx.db.get("users", adminUserId))
  expect(userBefore?.role).toBe("admin")
  expect(userBefore?.roles).toEqual(["admin"])

  // Revoke admin in Zitadel, updating canonical roles to member only
  const syncResult = await t.mutation(internal.userManagement.userManagementAuthUserRolesSyncInternalMutation, {
    providerSubject: "zitadel-admin-sub",
    roles: ["member"],
  })
  expect(syncResult.success).toBe(true)

  // Verify user's local auth record immediately revoked admin to member
  const userAfter = await t.run((ctx) => ctx.db.get("users", adminUserId))
  expect(userAfter?.role).toBe("member")
  expect(userAfter?.roles).toEqual(["member"])
})

test("composite org+user projection identity isolates same userId across different organizations", async () => {
  const { t, adminKey } = await userManagementFixtureCreate()

  // Upsert shared-user in org-alpha
  const upsertAlpha = await t.mutation(internal.userManagement.userProjectionUpsertInternalMutation, {
    userId: "shared-user",
    organizationId: "org-alpha",
    displayName: "Alpha User",
    roles: ["admin"],
    teamIds: [],
    syncedAt: "2026-10-14T00:00:00.000Z",
  })
  expect(upsertAlpha.success).toBe(true)

  // Upsert same shared-user in org-beta
  const upsertBeta = await t.mutation(internal.userManagement.userProjectionUpsertInternalMutation, {
    userId: "shared-user",
    organizationId: "org-beta",
    displayName: "Beta User",
    roles: ["member"],
    teamIds: [],
    syncedAt: "2026-10-14T00:00:00.000Z",
  })
  expect(upsertBeta.success).toBe(true)

  // Query org-alpha projection
  const getAlpha = await t.query(api.userManagement.userProjectionGetQuery, {
    token: adminKey,
    userId: "shared-user",
    organizationId: "org-alpha",
  })
  expect(getAlpha.success).toBe(true)
  if (getAlpha.success) {
    expect(getAlpha.data.organizationId).toBe("org-alpha")
    expect(getAlpha.data.displayName).toBe("Alpha User")
    expect(getAlpha.data.roles).toEqual(["admin"])
  }

  // Query org-beta projection
  const getBeta = await t.query(api.userManagement.userProjectionGetQuery, {
    token: adminKey,
    userId: "shared-user",
    organizationId: "org-beta",
  })
  expect(getBeta.success).toBe(true)
  if (getBeta.success) {
    expect(getBeta.data.organizationId).toBe("org-beta")
    expect(getBeta.data.displayName).toBe("Beta User")
    expect(getBeta.data.roles).toEqual(["member"])
  }

  // Verify updating org-alpha does NOT mutate org-beta
  await t.mutation(internal.userManagement.userProjectionUpsertInternalMutation, {
    userId: "shared-user",
    organizationId: "org-alpha",
    displayName: "Alpha User Updated",
    roles: ["user"],
    teamIds: [],
    syncedAt: "2026-10-14T01:00:00.000Z",
  })

  const reGetBeta = await t.query(api.userManagement.userProjectionGetQuery, {
    token: adminKey,
    userId: "shared-user",
    organizationId: "org-beta",
  })
  expect(reGetBeta.success).toBe(true)
  if (reGetBeta.success) {
    expect(reGetBeta.data.displayName).toBe("Beta User")
    expect(reGetBeta.data.roles).toEqual(["member"])
  }
})

test("stale cleanup continuation mutation deletes non-active records in paged batch", async () => {
  const { t } = await userManagementFixtureCreate()

  // Insert active and stale users in org-target
  await t.run(async (ctx) => {
    await ctx.db.insert("userProjections", {
      userId: "active-u1",
      organizationId: "org-target",
      roles: ["user"],
      teamIds: [],
      syncedAt: "2026-10-14T00:00:00.000Z",
    })
    await ctx.db.insert("userProjections", {
      userId: "stale-u2",
      organizationId: "org-target",
      roles: ["user"],
      teamIds: [],
      syncedAt: "2026-10-14T00:00:00.000Z",
    })
  })

  // Paginate first page cursor
  const firstPage = await t.run((ctx) =>
    ctx.db
      .query("userProjections")
      .withIndex("organizationId", (q) => q.eq("organizationId", "org-target"))
      .paginate({ cursor: null, numItems: 1 }),
  )

  const cleanupResult = await t.mutation(internal.userManagement.userProjectionStaleCleanupInternalMutation, {
    organizationId: "org-target",
    syncedUserIds: ["active-u1"],
    cursor: firstPage.continueCursor,
  })

  expect(cleanupResult.success).toBe(true)

  // Verify only active-u1 remains in org-target
  const remaining = await t.run((ctx) =>
    ctx.db
      .query("userProjections")
      .withIndex("organizationId", (q) => q.eq("organizationId", "org-target"))
      .collect(),
  )
  expect(remaining.length).toBe(1)
  expect(remaining[0]?.userId).toBe("active-u1")
})
