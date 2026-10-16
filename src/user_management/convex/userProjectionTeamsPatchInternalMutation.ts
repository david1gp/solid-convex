import { v } from "convex/values"
import { internalMutation } from "#convex/_generated/server.js"
import type { PromiseResult } from "#result"
import { createResult } from "#result"

export const userProjectionTeamsPatchInternalMutation = internalMutation({
  args: {
    userId: v.string(),
    organizationId: v.optional(v.string()),
    teamIds: v.array(v.string()),
    syncedAt: v.optional(v.string()),
  },
  handler: async (ctx, args): PromiseResult<{ readonly userId: string; readonly patched: boolean }> => {
    const existing =
      args.organizationId !== undefined
        ? await ctx.db
            .query("userProjections")
            .withIndex("orgIdAndUserId", (q) =>
              q.eq("organizationId", args.organizationId as string).eq("userId", args.userId),
            )
            .first()
        : await ctx.db
            .query("userProjections")
            .withIndex("userId", (q) => q.eq("userId", args.userId))
            .first()

    if (!existing) {
      return createResult({ userId: args.userId, patched: false })
    }

    await ctx.db.patch(existing._id, {
      teamIds: args.teamIds,
      ...(args.syncedAt ? { syncedAt: args.syncedAt } : {}),
    })

    return createResult({ userId: args.userId, patched: true })
  },
})
