import { v } from "convex/values"
import { internal } from "#convex/_generated/api.js"
import type { Id } from "#convex/_generated/dataModel.js"
import { internalMutation } from "#convex/_generated/server.js"
import { createResult, createResultError } from "#result"
import { nowIso } from "#utils/date/nowIso.js"

export const hierarchyDeleteWorkerProgressInternalMutation = internalMutation({
  args: {
    jobId: v.string(),
    expectedPhase: v.optional(v.string()),
    expectedCursor: v.optional(v.number()),
    nextPhase: v.string(),
    nextCursor: v.number(),
    status: v.union(v.literal("in_progress"), v.literal("completed"), v.literal("failed")),
    isRetryable: v.optional(v.boolean()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const op = "hierarchyDeleteWorkerProgressInternalMutation"
    const job = await ctx.db.get("hierarchyDeleteJobs", args.jobId as Id<"hierarchyDeleteJobs">)
    if (!job) {
      return createResultError(op, `Job not found: ${args.jobId}`)
    }

    if (job.status === "completed" || job.status === "failed") {
      return createResult({
        shouldStop: true,
        status: job.status,
      })
    }

    if (args.expectedPhase !== undefined && job.phase !== undefined && job.phase !== args.expectedPhase) {
      return createResult({
        shouldStop: true,
        reason: "cas_mismatch",
      })
    }
    if (args.expectedCursor !== undefined && job.cursor !== undefined && job.cursor !== args.expectedCursor) {
      return createResult({
        shouldStop: true,
        reason: "cas_mismatch",
      })
    }

    const now = nowIso()
    await ctx.db.patch(job._id, {
      phase: args.nextPhase as any,
      cursor: args.nextCursor,
      status: args.status,
      isRetryable: args.isRetryable ?? false,
      error: args.error,
      updatedAt: now,
    })

    if (args.status === "in_progress") {
      await ctx.scheduler.runAfter(0, internal.hierarchyDeleteActions.hierarchyDeleteWorkerStepInternalAction, {
        jobId: job._id,
        expectedPhase: args.nextPhase,
        expectedCursor: args.nextCursor,
      })
    }

    return createResult({
      phase: args.nextPhase,
      cursor: args.nextCursor,
      status: args.status,
    })
  },
})
