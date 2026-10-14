import { v } from "convex/values"
import type { Id } from "#convex/_generated/dataModel.js"
import { internalMutation } from "#convex/_generated/server.js"
import { createResult, createResultError } from "#result"
import { hierarchyDeleteRootLockCheckFn } from "#src/hierarchy_delete/convex/hierarchyDeleteRootLockCheckFn.ts"
import type { HierarchyDeleteWorkerPhase } from "#src/hierarchy_delete/model/hierarchyDeleteWorkerPhaseSchema.ts"
import { nowIso } from "#utils/date/nowIso.js"

export const hierarchyDeleteWorkerClaimInternalMutation = internalMutation({
  args: {
    jobId: v.string(),
    expectedPhase: v.optional(v.string()),
    expectedCursor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const op = "hierarchyDeleteWorkerClaimInternalMutation"
    const job = await ctx.db.get("hierarchyDeleteJobs", args.jobId as Id<"hierarchyDeleteJobs">)
    if (!job) {
      return createResultError(op, `Job not found: ${args.jobId}`)
    }

    if (job.status === "completed" || job.status === "failed") {
      return createResult({
        shouldStop: true as const,
        status: job.status,
      })
    }

    if (args.expectedPhase !== undefined && job.phase !== undefined && job.phase !== args.expectedPhase) {
      return createResult({
        shouldStop: true as const,
        reason: "cas_mismatch",
      })
    }
    if (args.expectedCursor !== undefined && job.cursor !== undefined && job.cursor !== args.expectedCursor) {
      return createResult({
        shouldStop: true as const,
        reason: "cas_mismatch",
      })
    }

    const currentPhase = (job.phase ?? "delete_r2_objects") as HierarchyDeleteWorkerPhase
    const currentCursor = job.cursor ?? 0

    const isLocked = await hierarchyDeleteRootLockCheckFn(ctx.db, job.rootKind, job.rootId, job._id, currentPhase)
    if (!isLocked) {
      const now = nowIso()
      await ctx.db.patch(job._id, {
        status: "failed",
        isRetryable: false,
        error: "Root lock lost: root entity is no longer locked by this deletion job",
        updatedAt: now,
      })
      return createResultError(op, "Root lock lost")
    }

    const now = nowIso()
    if (job.status === "pending") {
      await ctx.db.patch(job._id, {
        status: "in_progress",
        updatedAt: now,
      })
    }

    return createResult({
      shouldStop: false as const,
      job: {
        jobId: job._id,
        root: { kind: job.rootKind, id: job.rootId, name: job.rootName, orgHandle: job.orgHandle },
        counts: {
          ...job.counts,
          orgMembers: job.counts.orgMembers ?? 0,
          orgInvitations: job.counts.orgInvitations ?? 0,
        },
        fingerprint: job.fingerprint,
        scope: {
          ...job.scope,
          orgMemberIds: job.scope.orgMemberIds ?? [],
          orgInvitationIds: job.scope.orgInvitationIds ?? [],
        },
        phase: currentPhase,
        cursor: currentCursor,
        status: "in_progress" as const,
        isRetryable: false,
      },
    })
  },
})
