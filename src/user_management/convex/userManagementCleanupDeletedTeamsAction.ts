import { v } from "convex/values"
import { internal } from "#convex/_generated/api.js"
import { internalAction } from "#convex/_generated/server.js"
import { createResult, createResultError } from "#result"
import type { PromiseResult } from "#result"
import { zitadelServerConfigFromEnv } from "#src/user_management/server/zitadelServerConfigFromEnv.ts"
import {
  type ZitadelUserCleanupError,
  zitadelUserDeletedTeamIdsCleanup,
} from "#src/user_management/server/zitadelUserDeletedTeamIdsCleanup.ts"

interface UserManagementCleanupDeletedTeamsResult {
  readonly jobId: string
  readonly processedCount: number
  readonly updatedCount: number
  readonly skippedCount: number
  readonly totalCount: number
  readonly hasMore: boolean
  readonly nextCursor: string | null
  readonly errors: readonly ZitadelUserCleanupError[]
}

export const userManagementCleanupDeletedTeamsAction = internalAction({
  args: {
    jobId: v.string(),
    deletedTeamIds: v.array(v.string()),
    organizationId: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args): PromiseResult<UserManagementCleanupDeletedTeamsResult> => {
    const op = "userManagementCleanupDeletedTeamsAction"

    if (!args.jobId || args.jobId.trim() === "") {
      return createResultError(op, "Invalid jobId: jobId is required and cannot be empty")
    }

    if (!args.deletedTeamIds || args.deletedTeamIds.length === 0) {
      return createResult({
        jobId: args.jobId,
        processedCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        totalCount: 0,
        hasMore: false,
        nextCursor: null,
        errors: [],
      })
    }

    const configResult = zitadelServerConfigFromEnv()
    if (!configResult.success) {
      return createResultError(op, `Missing Zitadel configuration: ${configResult.errorMessage}`)
    }
    const config = configResult.data

    const cleanupResult = await zitadelUserDeletedTeamIdsCleanup({
      config,
      deletedTeamIds: args.deletedTeamIds,
      organizationId: args.organizationId,
      limit: args.limit,
      cursor: args.cursor,
      onUserUpdated: async (update) => {
        await ctx.runMutation(internal.userManagement.userProjectionTeamsPatchInternalMutation, {
          userId: update.userId,
          organizationId: args.organizationId,
          teamIds: [...update.newTeamIds],
          syncedAt: new Date().toISOString(),
        })
      },
    })

    if (!cleanupResult.success) {
      return createResultError(op, cleanupResult.errorMessage)
    }

    return createResult({
      jobId: args.jobId,
      processedCount: cleanupResult.data.processedCount,
      updatedCount: cleanupResult.data.updatedUsers.length,
      skippedCount: cleanupResult.data.skippedUserIds.length,
      totalCount: cleanupResult.data.totalCount,
      hasMore: cleanupResult.data.hasMore,
      nextCursor: cleanupResult.data.nextCursor,
      errors: cleanupResult.data.errors,
    })
  },
})
