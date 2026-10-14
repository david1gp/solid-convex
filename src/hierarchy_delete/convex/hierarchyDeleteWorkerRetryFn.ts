import type { ActionCtx } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import { hierarchyDeleteWorkerRunFn } from "#src/hierarchy_delete/convex/hierarchyDeleteWorkerRunFn.ts"
import type { HierarchyDeleteJobState } from "#src/hierarchy_delete/model/hierarchyDeleteJobStateSchema.ts"

export async function hierarchyDeleteWorkerRetryFn(
  ctx: ActionCtx,
  failedState: HierarchyDeleteJobState,
  maxSteps = 100,
): PromiseResult<HierarchyDeleteJobState> {
  const op = "hierarchyDeleteWorkerRetryFn"

  if (failedState.status !== "error" && failedState.status !== "failed") {
    return createResultError(
      op,
      "Cannot retry job that is not in error state",
      JSON.stringify({ status: failedState.status }),
    )
  }

  if (!failedState.isRetryable) {
    return createResultError(op, "Job error is not marked as retryable", failedState.errorMessage)
  }

  const resumedState: HierarchyDeleteJobState = {
    ...failedState,
    status: "in_progress",
    isRetryable: false,
    errorMessage: undefined,
  }

  return hierarchyDeleteWorkerRunFn(ctx, resumedState, maxSteps)
}
