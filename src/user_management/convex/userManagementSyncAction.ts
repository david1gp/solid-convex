import { v } from "convex/values"
import { internal } from "#convex/_generated/api.js"
import { action } from "#convex/_generated/server.js"
import type { PromiseResult } from "#result"
import { createResult } from "#result"
import { zitadelOrgUsersSyncFetch } from "#src/user_management/server/zitadelOrgUsersSyncFetch.ts"
import { zitadelServerConfigFromEnv } from "#src/user_management/server/zitadelServerConfigFromEnv.ts"

interface UserManagementSyncResult {
  readonly syncedCount: number
  readonly deletedStaleCount: number
  readonly totalCount: number
}

export const userManagementSyncAction = action({
  args: {
    token: v.string(),
    organizationId: v.optional(v.string()),
    // Preserved in schema for client compatibility, but completeness is server-derived
    isCompleteSync: v.optional(v.boolean()),
  },
  handler: async (ctx, args): PromiseResult<UserManagementSyncResult> => {
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

    // Bounded paged fetch across all users, grants, and team IDs; fails on any read failure
    const fetchResult = await zitadelOrgUsersSyncFetch({
      config,
      organizationId,
    })
    if (!fetchResult.success) {
      return fetchResult
    }

    // Server-derived completeness flag; untrusted client input is never used to trigger stale deletion
    const isCompleteSync = fetchResult.data.isComplete

    const syncMutationResult = await ctx.runMutation(
      internal.userManagement.userProjectionSyncRecordsInternalMutation,
      {
        records: fetchResult.data.records as any,
        organizationId,
        isCompleteSync,
      },
    )

    if (!syncMutationResult.success) {
      return syncMutationResult
    }

    return createResult({
      syncedCount: syncMutationResult.data.upsertedCount,
      deletedStaleCount: syncMutationResult.data.deletedStaleCount,
      totalCount: fetchResult.data.totalCount,
    })
  },
})
