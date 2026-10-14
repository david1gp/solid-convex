import type { ActionCtx } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import { hierarchyDeleteWorkerStepActionFn } from "#src/hierarchy_delete/convex/hierarchyDeleteWorkerStepActionFn.ts"
import type { HierarchyDeleteJobState } from "#src/hierarchy_delete/model/hierarchyDeleteJobStateSchema.ts"

export async function hierarchyDeleteWorkerRunFn(
  ctx: ActionCtx,
  initialState: HierarchyDeleteJobState,
  maxSteps = 100,
): PromiseResult<HierarchyDeleteJobState> {
  const op = "hierarchyDeleteWorkerRunFn"
  let currentState = initialState
  let steps = 0

  while (steps < maxSteps) {
    steps++

    const stepResult = await hierarchyDeleteWorkerStepActionFn(ctx, currentState)
    if (!stepResult.success) {
      return stepResult
    }

    currentState = stepResult.data

    if (currentState.status === "error" || currentState.status === "failed") {
      return createResult(currentState)
    }

    if (currentState.status === "completed" || currentState.phase === "completed") {
      return createResult({
        ...currentState,
        status: "completed",
        phase: "completed",
      })
    }
  }

  return createResultError(
    op,
    `Worker reached maximum step execution limit of ${maxSteps} without completing`,
    JSON.stringify({ steps }),
  )
}
