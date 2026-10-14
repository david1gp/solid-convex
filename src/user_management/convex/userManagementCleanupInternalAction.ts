import { v } from "convex/values"
import { internalAction } from "#convex/_generated/server.js"
import { userManagementCleanupActionFn } from "#src/user_management/convex/userManagementCleanupActionFn.ts"

export const userManagementCleanupInternalAction = internalAction({
  args: {
    deletedTeamIds: v.array(v.string()),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: userManagementCleanupActionFn,
})
