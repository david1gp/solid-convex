import { internal } from "#convex/_generated/api.js"
import type { ActionCtx } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import { r2ObjectDelete } from "#src/r2/api_r2/r2ObjectDelete.ts"
import { userManagementCleanupActionFn } from "#src/user_management/convex/userManagementCleanupActionFn.ts"

const BATCH_SIZE = 25

export interface HierarchyDeleteWorkerDurableStepArgs {
  jobId: string
  expectedPhase?: string
  expectedCursor?: number
  expectedGeneration?: number
}

export async function hierarchyDeleteWorkerDurableStepFn(
  ctx: ActionCtx,
  args: HierarchyDeleteWorkerDurableStepArgs,
): PromiseResult<unknown> {
  const op = "hierarchyDeleteWorkerDurableStepFn"
  let activePhase = args.expectedPhase
  let activeCursor = args.expectedCursor

  try {
    const claimResult = await ctx.runMutation(internal.hierarchyDelete.hierarchyDeleteWorkerClaimInternalMutation, {
      jobId: args.jobId,
      expectedPhase: args.expectedPhase,
      expectedCursor: args.expectedCursor,
      expectedGeneration: args.expectedGeneration,
    })
    if (!claimResult.success) {
      return claimResult
    }

    if (claimResult.data.shouldStop || !("job" in claimResult.data)) {
      return createResult(claimResult.data)
    }

    const job = claimResult.data.job
    if (!job) {
      return createResultError(op, "Claim succeeded but no job returned")
    }

    activePhase = job.phase
    activeCursor = job.cursor
    // Phase 1: R2 Object Deletion
    if (job.phase === "delete_r2_objects") {
      const items = job.scope.fileIds
      if (items.length === 0 || job.cursor >= items.length) {
        return await ctx.runMutation(internal.hierarchyDelete.hierarchyDeleteWorkerProgressInternalMutation, {
          jobId: job.jobId,
          expectedPhase: job.phase,
          expectedCursor: job.cursor,
          nextPhase: "delete_file_records",
          nextCursor: 0,
          status: "in_progress",
        })
      }

      const batch = items.slice(job.cursor, job.cursor + BATCH_SIZE)
      for (const fileId of batch) {
        const deleteResult = await r2ObjectDelete(fileId)
        if (!deleteResult.success) {
          console.error(op, {
            jobId: job.jobId,
            phase: job.phase,
            cursor: job.cursor,
            error: deleteResult.errorMessage,
          })
          return await ctx.runMutation(internal.hierarchyDelete.hierarchyDeleteWorkerProgressInternalMutation, {
            jobId: job.jobId,
            expectedPhase: job.phase,
            expectedCursor: job.cursor,
            nextPhase: job.phase,
            nextCursor: job.cursor,
            status: "failed",
            isRetryable: true,
            error: `R2 object deletion failed for ${fileId}: ${deleteResult.errorMessage}`,
          })
        }
      }

      const nextCursor = job.cursor + batch.length
      const isDone = nextCursor >= items.length
      const nextPhase = isDone ? "delete_file_records" : "delete_r2_objects"
      const finalCursor = isDone ? 0 : nextCursor

      return await ctx.runMutation(internal.hierarchyDelete.hierarchyDeleteWorkerProgressInternalMutation, {
        jobId: job.jobId,
        expectedPhase: job.phase,
        expectedCursor: job.cursor,
        nextPhase,
        nextCursor: finalCursor,
        status: "in_progress",
      })
    }

    // Phase 6: Zitadel User Management Cleanup for Teams
    if (job.phase === "cleanup_teams_zitadel") {
      const items = job.scope.teamIds
      if (items.length === 0) {
        return await ctx.runMutation(internal.hierarchyDelete.hierarchyDeleteWorkerProgressInternalMutation, {
          jobId: job.jobId,
          expectedPhase: job.phase,
          expectedCursor: job.cursor,
          nextPhase: "delete_teams",
          nextCursor: 0,
          status: "in_progress",
        })
      }

      const cursor = String(job.cursor ?? 0)
      const cleanupResult = await userManagementCleanupActionFn(ctx, {
        deletedTeamIds: items,
        cursor,
        limit: BATCH_SIZE,
      })

      const hasErrors = !cleanupResult.success || (cleanupResult.data?.errors && cleanupResult.data.errors.length > 0)
      if (hasErrors) {
        const errorMessage = !cleanupResult.success
          ? cleanupResult.errorMessage
          : `User team cleanup encountered partial errors: ${cleanupResult.data.errors[0]?.message ?? "unknown error"}`
        console.error(op, { jobId: job.jobId, phase: job.phase, cursor: job.cursor, error: errorMessage })
        return await ctx.runMutation(internal.hierarchyDelete.hierarchyDeleteWorkerProgressInternalMutation, {
          jobId: job.jobId,
          expectedPhase: job.phase,
          expectedCursor: job.cursor,
          nextPhase: job.phase,
          nextCursor: job.cursor,
          status: "failed",
          isRetryable: true,
          error: errorMessage,
        })
      }

      if (cleanupResult.data.hasMore) {
        const parsedCursor =
          cleanupResult.data.nextCursor != null ? Number.parseInt(cleanupResult.data.nextCursor, 10) : Number.NaN
        const nextCursor = !Number.isNaN(parsedCursor)
          ? parsedCursor
          : (cleanupResult.data.nextOffset ?? job.cursor + cleanupResult.data.processedCount)

        return await ctx.runMutation(internal.hierarchyDelete.hierarchyDeleteWorkerProgressInternalMutation, {
          jobId: job.jobId,
          expectedPhase: job.phase,
          expectedCursor: job.cursor,
          nextPhase: "cleanup_teams_zitadel",
          nextCursor,
          status: "in_progress",
        })
      }

      return await ctx.runMutation(internal.hierarchyDelete.hierarchyDeleteWorkerProgressInternalMutation, {
        jobId: job.jobId,
        expectedPhase: job.phase,
        expectedCursor: job.cursor,
        nextPhase: "delete_teams",
        nextCursor: 0,
        status: "in_progress",
      })
    }

    // Database-only deletion phases: delegate to internal mutation with jobId
    return await ctx.runMutation(internal.hierarchyDelete.hierarchyDeleteWorkerStepInternalMutation, {
      jobId: job.jobId,
      expectedPhase: job.phase,
      expectedCursor: job.cursor,
    })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error(op, { jobId: args.jobId, phase: activePhase, cursor: activeCursor, error: errorMsg })
    try {
      const progressResult = await ctx.runMutation(
        internal.hierarchyDelete.hierarchyDeleteWorkerProgressInternalMutation,
        {
          jobId: args.jobId,
          expectedPhase: activePhase,
          expectedCursor: activeCursor,
          nextPhase: activePhase ?? "delete_r2_objects",
          nextCursor: activeCursor ?? 0,
          status: "failed",
          isRetryable: true,
          error: errorMsg,
        },
      )
      if (!progressResult.success) {
        return createResultError(
          op,
          `Action execution failed (${errorMsg}) and failed to patch job status: ${progressResult.errorMessage}`,
        )
      }
      return progressResult
    } catch (patchErr) {
      const patchMsg = patchErr instanceof Error ? patchErr.message : String(patchErr)
      return createResultError(op, `Action execution failed (${errorMsg}) and persistence threw: ${patchMsg}`)
    }
  }
}
