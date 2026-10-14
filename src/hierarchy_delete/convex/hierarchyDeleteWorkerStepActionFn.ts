import { internal } from "#convex/_generated/api.js"
import type { ActionCtx } from "#convex/_generated/server.js"
import { createResult, type PromiseResult } from "#result"
import { hierarchyDeleteWorkerDbStepFn } from "#src/hierarchy_delete/convex/hierarchyDeleteWorkerDbStepFn.ts"
import type { HierarchyDeleteJobState } from "#src/hierarchy_delete/model/hierarchyDeleteJobStateSchema.ts"
import { r2ObjectDelete } from "#src/r2/api_r2/r2ObjectDelete.ts"
import { userManagementCleanupActionFn } from "#src/user_management/convex/userManagementCleanupActionFn.ts"

const BATCH_SIZE = 25

export async function hierarchyDeleteWorkerStepActionFn(
  ctx: ActionCtx,
  state: HierarchyDeleteJobState,
): PromiseResult<HierarchyDeleteJobState> {
  const currentState: HierarchyDeleteJobState = {
    ...state,
    status: "in_progress",
    errorMessage: undefined,
  }

  if (currentState.status === "completed" || currentState.phase === "completed") {
    return createResult({
      ...currentState,
      status: "completed",
      phase: "completed",
    })
  }

  // Phase 1: R2 Object Deletion
  if (currentState.phase === "delete_r2_objects") {
    const items = currentState.scope.fileIds
    if (items.length === 0 || currentState.cursor >= items.length) {
      return createResult({
        ...currentState,
        phase: "delete_file_records",
        cursor: 0,
      })
    }

    const batch = items.slice(currentState.cursor, currentState.cursor + BATCH_SIZE)
    for (const fileId of batch) {
      const deleteResult = await r2ObjectDelete(fileId)
      if (!deleteResult.success) {
        return createResult({
          ...currentState,
          status: "error",
          isRetryable: true,
          errorMessage: `R2 object deletion failed for ${fileId}: ${deleteResult.errorMessage}`,
        })
      }
    }

    const nextCursor = currentState.cursor + batch.length
    if (nextCursor >= items.length) {
      return createResult({
        ...currentState,
        phase: "delete_file_records",
        cursor: 0,
      })
    }

    return createResult({
      ...currentState,
      cursor: nextCursor,
    })
  }

  // Phase 6: Zitadel User Management Cleanup for Teams
  if (currentState.phase === "cleanup_teams_zitadel") {
    const items = currentState.scope.teamIds
    if (items.length === 0) {
      return createResult({
        ...currentState,
        phase: "delete_teams",
        cursor: 0,
      })
    }

    const cleanupResult = await userManagementCleanupActionFn(ctx, {
      deletedTeamIds: items,
      limit: BATCH_SIZE,
    })

    if (!cleanupResult.success) {
      return createResult({
        ...currentState,
        status: "error",
        isRetryable: true,
        errorMessage: cleanupResult.errorMessage,
      })
    }

    if (cleanupResult.data.hasMore && cleanupResult.data.nextCursor) {
      return createResult({
        ...currentState,
        cursor: currentState.cursor + cleanupResult.data.processedCount,
      })
    }

    return createResult({
      ...currentState,
      phase: "delete_teams",
      cursor: 0,
    })
  }

  // Database-only deletion phases: delegate to internal mutation or local DB step
  if (typeof (ctx as any).runMutation === "function") {
    const mutationResult = await ctx.runMutation(internal.hierarchyDelete.hierarchyDeleteWorkerStepInternalMutation, {
      state: currentState,
    })
    return mutationResult
  }

  return hierarchyDeleteWorkerDbStepFn(ctx as any, currentState)
}
