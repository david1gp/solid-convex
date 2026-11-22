import { v } from "convex/values"
import { internal } from "#convex/_generated/api.js"
import { internalAction } from "#convex/_generated/server.js"
import { createResultError, type PromiseResult } from "#result"
import { hierarchyDeleteJobStateConvexFields } from "#src/hierarchy_delete/convex/hierarchyDeleteJobStateConvexFields.ts"
import { hierarchyDeleteWorkerDurableStepFn } from "#src/hierarchy_delete/convex/hierarchyDeleteWorkerDurableStepFn.ts"
import { hierarchyDeleteWorkerStepActionFn } from "#src/hierarchy_delete/convex/hierarchyDeleteWorkerStepActionFn.ts"
import type { HierarchyDeleteJobState } from "#src/hierarchy_delete/model/hierarchyDeleteJobStateSchema.ts"

export const hierarchyDeleteWorkerStepInternalAction = internalAction({
  args: {
    jobId: v.optional(v.string()),
    expectedPhase: v.optional(v.string()),
    expectedCursor: v.optional(v.number()),
    expectedGeneration: v.optional(v.number()),
    state: v.optional(v.object(hierarchyDeleteJobStateConvexFields)),
  },
  handler: async (ctx, args): PromiseResult<unknown> => {
    if (args.jobId) {
      const result = await hierarchyDeleteWorkerDurableStepFn(ctx, {
        jobId: args.jobId,
        expectedPhase: args.expectedPhase,
        expectedCursor: args.expectedCursor,
        expectedGeneration: args.expectedGeneration,
      })
      if (result.success) return result

      console.error("Hierarchy deletion worker failed", {
        jobId: args.jobId,
        phase: args.expectedPhase,
        cursor: args.expectedCursor,
        error: result.errorMessage,
      })
      // Never report a successful scheduled action when failure could not be
      // recorded. The independently scheduled watchdog covers persistence outages.
      if (args.expectedPhase === undefined || args.expectedCursor === undefined) throw new Error(result.errorMessage)
      const failure = await ctx.runMutation(internal.hierarchyDelete.hierarchyDeleteWorkerProgressInternalMutation, {
        jobId: args.jobId,
        expectedPhase: args.expectedPhase,
        expectedCursor: args.expectedCursor,
        nextPhase: args.expectedPhase,
        nextCursor: args.expectedCursor,
        status: "failed",
        isRetryable: true,
        error: result.errorMessage,
      })
      if (!failure.success) throw new Error(`Could not record deletion failure: ${failure.errorMessage}`)
      return failure
    }
    if (args.state) {
      const state: HierarchyDeleteJobState = {
        ...args.state,
        counts: {
          ...args.state.counts,
          orgMembers: args.state.counts.orgMembers ?? 0,
          orgInvitations: args.state.counts.orgInvitations ?? 0,
        },
        scope: {
          ...args.state.scope,
          orgMemberIds: args.state.scope.orgMemberIds ?? [],
          orgInvitationIds: args.state.scope.orgInvitationIds ?? [],
        },
      }
      return hierarchyDeleteWorkerStepActionFn(ctx, state)
    }
    return createResultError("hierarchyDeleteWorkerStepInternalAction", "Neither jobId nor state provided")
  },
})
