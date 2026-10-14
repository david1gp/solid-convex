import { v } from "convex/values"
import { internalQuery, type QueryCtx } from "#convex/_generated/server.js"
import { createResult, createResultError } from "#result"
import type { PromiseResult } from "#result"

export const userManagementTeamsValidateInternalQuery = internalQuery({
  args: { teamIds: v.array(v.string()) },
  handler: async (ctx: QueryCtx, args): PromiseResult<boolean> => {
    const op = "userManagementTeamsValidateInternalQuery"
    for (const teamId of args.teamIds) {
      const normalizedId = ctx.db.normalizeId("teams", teamId)
      if (!normalizedId) {
        return createResultError(op, `Invalid team ID format: ${teamId}`)
      }
      const team = await ctx.db.get("teams", normalizedId)
      if (!team) {
        return createResultError(op, `Team not found: ${teamId}`)
      }
    }
    return createResult(true)
  },
})
