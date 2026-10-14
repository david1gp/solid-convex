import { internal } from "#convex/_generated/api.js"
import type { ActionCtx } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import { zitadelServerConfigFromEnv } from "#src/user_management/server/zitadelServerConfigFromEnv.ts"
import {
  type ZitadelUserDeletedTeamIdsCleanupResult,
  zitadelUserDeletedTeamIdsCleanup,
} from "#src/user_management/server/zitadelUserDeletedTeamIdsCleanup.ts"

export async function userManagementCleanupActionFn(
  ctx: ActionCtx,
  args: {
    readonly deletedTeamIds: readonly string[]
    readonly cursor?: string
    readonly limit?: number
  },
): PromiseResult<ZitadelUserDeletedTeamIdsCleanupResult> {
  const op = "userManagementCleanupActionFn"

  if (args.deletedTeamIds.length === 0) {
    return createResult({
      processedCount: 0,
      updatedUsers: [],
      skippedUserIds: [],
      totalCount: 0,
      nextCursor: null,
      nextOffset: null,
      hasMore: false,
      errors: [],
    })
  }

  const configResult = zitadelServerConfigFromEnv()
  if (!configResult.success) {
    return createResultError(
      op,
      `Zitadel server credentials unavailable: ${configResult.errorMessage}`,
      configResult.errorMessage,
    )
  }

  const cleanupResult = await zitadelUserDeletedTeamIdsCleanup({
    config: configResult.data,
    deletedTeamIds: args.deletedTeamIds,
    cursor: args.cursor,
    limit: args.limit ?? 25,
    onUserUpdated: async (update) => {
      await ctx.runMutation(internal.userManagement.userProjectionTeamsPatchInternalMutation, {
        userId: update.userId,
        teamIds: [...update.newTeamIds],
      })
    },
  })

  if (!cleanupResult.success) {
    return createResultError(op, cleanupResult.errorMessage, cleanupResult.errorMessage)
  }

  if (cleanupResult.data.errors.length > 0) {
    const firstError = cleanupResult.data.errors[0]
    return createResultError(
      op,
      `User team cleanup encountered errors: ${firstError?.message ?? "unknown error"}`,
      JSON.stringify(cleanupResult.data.errors),
    )
  }

  return cleanupResult
}
