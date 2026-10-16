import { v } from "convex/values"
import { internal } from "#convex/_generated/api.js"
import { action } from "#convex/_generated/server.js"
import type { PromiseResult } from "#result"
import { createResult, createResultError } from "#result"
import { zitadelOrgUsersSyncFetch } from "#src/user_management/server/zitadelOrgUsersSyncFetch.ts"
import { zitadelServerConfigFromEnv } from "#src/user_management/server/zitadelServerConfigFromEnv.ts"
import { zitadelUserGet } from "#src/user_management/server/zitadelUserGet.ts"
import { zitadelUserGrantList } from "#src/user_management/server/zitadelUserGrantList.ts"
import { zitadelUserTeamIdsGet } from "#src/user_management/server/zitadelUserTeamIdsGet.ts"

interface UserManagementRefreshResult {
  readonly refreshedUserId?: string
  readonly syncedCount?: number
  readonly totalCount?: number
}

export const userManagementRefreshAction = action({
  args: {
    token: v.string(),
    userId: v.optional(v.string()),
    organizationId: v.optional(v.string()),
  },
  handler: async (ctx, args): PromiseResult<UserManagementRefreshResult> => {
    const op = "userManagementRefreshAction"

    const adminCheck = await ctx.runQuery(internal.userManagement.userManagementAdminCheckInternalQuery, {
      token: args.token,
    })
    if (!adminCheck.success) {
      return adminCheck
    }

    const configResult = zitadelServerConfigFromEnv()
    if (!configResult.success) {
      return configResult
    }
    const config = configResult.data
    const organizationId = args.organizationId ?? config.organizationId

    if (args.userId) {
      // Target organization verify before ANY refresh; foreign/missing users are rejected without sparse upsert
      const userGetResult = await zitadelUserGet({
        config,
        userId: args.userId,
        organizationId,
      })
      if (!userGetResult.success) {
        return userGetResult
      }
      const userSummary = userGetResult.data

      // Read authority grants and team IDs; fail required reads never overwrite with fabricated empty
      const [grantsResult, teamIdsResult] = await Promise.all([
        zitadelUserGrantList({
          config,
          userId: args.userId,
          projectId: config.projectId,
        }),
        zitadelUserTeamIdsGet({
          config,
          userId: args.userId,
        }),
      ])

      if (!grantsResult.success) {
        return createResultError(op, `Failed to load user grants: ${grantsResult.errorMessage}`)
      }
      if (!teamIdsResult.success) {
        return createResultError(op, `Failed to load user team IDs: ${teamIdsResult.errorMessage}`)
      }

      const effectiveRoles = grantsResult.data
        .filter((g) => g.userId === args.userId)
        .flatMap((g) => g.roleKeys)
        .filter((k) => k === "admin" || k === "member" || k === "user")

      const effectiveTeamIds = teamIdsResult.data
      const syncedAt = new Date().toISOString()

      await ctx.runMutation(internal.userManagement.userProjectionUpsertInternalMutation, {
        userId: args.userId,
        organizationId,
        username: userSummary.username,
        preferredLoginName: userSummary.preferredLoginName,
        displayName: userSummary.displayName,
        email: userSummary.email,
        state: userSummary.state,
        isHuman: userSummary.isHuman,
        roles: effectiveRoles,
        teamIds: [...effectiveTeamIds],
        syncedAt,
      })

      // Immediate local roles update on actual successful role change/re-read to prevent stale admin
      await ctx.runMutation(internal.userManagement.userManagementAuthUserRolesSyncInternalMutation, {
        providerSubject: args.userId,
        roles: effectiveRoles,
      })

      return createResult({
        refreshedUserId: args.userId,
      })
    }

    // Refresh all users in organization with bounded paging
    const fetchResult = await zitadelOrgUsersSyncFetch({
      config,
      organizationId,
    })
    if (!fetchResult.success) {
      return fetchResult
    }

    const syncMutationResult = await ctx.runMutation(
      internal.userManagement.userProjectionSyncRecordsInternalMutation,
      {
        records: fetchResult.data.records as any,
        organizationId,
        isCompleteSync: fetchResult.data.isComplete,
      },
    )

    if (!syncMutationResult.success) {
      return syncMutationResult
    }

    return createResult({
      syncedCount: syncMutationResult.data.upsertedCount,
      totalCount: fetchResult.data.totalCount,
    })
  },
})
