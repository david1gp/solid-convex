import { internal } from "#convex/_generated/api.js"
import type { Id } from "#convex/_generated/dataModel.js"
import type { MutationCtx } from "#convex/_generated/server.js"
import { hierarchyDeleteWorkerWatchdogScheduleFn } from "#src/hierarchy_delete/convex/hierarchyDeleteWorkerWatchdogScheduleFn.ts"

export async function hierarchyDeleteWorkerScheduleFn(
  ctx: MutationCtx,
  jobId: Id<"hierarchyDeleteJobs">,
  phase: string,
  cursor: number,
): Promise<void> {
  const job = await ctx.db.get("hierarchyDeleteJobs", jobId)
  if (!job) throw new Error(`Cannot schedule missing hierarchy delete job ${jobId}`)
  // The watchdog and worker are scheduled in the same transaction.
  const generation = await hierarchyDeleteWorkerWatchdogScheduleFn(ctx, jobId, job.workerGeneration ?? 0)
  await ctx.scheduler.runAfter(0, internal.hierarchyDeleteActions.hierarchyDeleteWorkerStepInternalAction, {
    jobId,
    expectedPhase: phase,
    expectedCursor: cursor,
    expectedGeneration: generation,
  })
}
