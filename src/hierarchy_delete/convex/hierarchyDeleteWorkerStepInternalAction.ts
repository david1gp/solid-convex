import { v } from "convex/values"
import { internalAction } from "#convex/_generated/server.js"
import { createResultError } from "#result"
import { hierarchyDeleteJobStateConvexFields } from "#src/hierarchy_delete/convex/hierarchyDeleteJobStateConvexFields.ts"
import { hierarchyDeleteWorkerDurableStepFn } from "#src/hierarchy_delete/convex/hierarchyDeleteWorkerDurableStepFn.ts"
import { hierarchyDeleteWorkerStepActionFn } from "#src/hierarchy_delete/convex/hierarchyDeleteWorkerStepActionFn.ts"
import type { HierarchyDeleteJobState } from "#src/hierarchy_delete/model/hierarchyDeleteJobStateSchema.ts"

export const hierarchyDeleteWorkerStepInternalAction = internalAction({
  args: {
    jobId: v.optional(v.string()),
    expectedPhase: v.optional(v.string()),
    expectedCursor: v.optional(v.number()),
    state: v.optional(v.object(hierarchyDeleteJobStateConvexFields)),
  },
  handler: async (ctx, args) => {
    if (args.jobId) {
      return hierarchyDeleteWorkerDurableStepFn(ctx, {
        jobId: args.jobId,
        expectedPhase: args.expectedPhase,
        expectedCursor: args.expectedCursor,
      })
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
