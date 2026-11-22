import { internal } from "#convex/_generated/api.js"
import type { Id } from "#convex/_generated/dataModel.js"
import type { MutationCtx } from "#convex/_generated/server.js"

// Longer than Convex's maximum action execution time.
const WATCHDOG_DELAY_MS = 15 * 60 * 1000

export async function hierarchyDeleteWorkerWatchdogScheduleFn(
  ctx: MutationCtx,
  jobId: Id<"hierarchyDeleteJobs">,
  currentGeneration: number,
): Promise<number> {
  const generation = currentGeneration + 1
  await ctx.db.patch(jobId, { workerGeneration: generation })
  await ctx.scheduler.runAfter(
    WATCHDOG_DELAY_MS,
    internal.hierarchyDelete.hierarchyDeleteWorkerWatchdogInternalMutation,
    {
      jobId,
      generation,
    },
  )
  return generation
}
