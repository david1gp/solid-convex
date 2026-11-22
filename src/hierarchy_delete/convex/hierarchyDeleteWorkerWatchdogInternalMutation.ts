import { v } from "convex/values"
import type { Id } from "#convex/_generated/dataModel.js"
import { internalMutation } from "#convex/_generated/server.js"
import { nowIso } from "#utils/date/nowIso.js"

export const hierarchyDeleteWorkerWatchdogInternalMutation = internalMutation({
  args: { jobId: v.string(), generation: v.number() },
  handler: async (ctx, { jobId, generation }) => {
    const job = await ctx.db.get("hierarchyDeleteJobs", jobId as Id<"hierarchyDeleteJobs">)
    if (!job || job.workerGeneration !== generation || (job.status !== "pending" && job.status !== "in_progress")) {
      return
    }
    console.error("Hierarchy deletion worker timed out", { jobId, phase: job.phase, cursor: job.cursor, generation })
    await ctx.db.patch(job._id, {
      status: "failed",
      isRetryable: true,
      error: "Deletion worker did not complete this step. Please retry.",
      updatedAt: nowIso(),
    })
  },
})
