import { v } from "convex/values"
import { internalMutation } from "#convex/_generated/server.js"
import type { PromiseResult } from "#result"
import { createResult } from "#result"

export const userProjectionUpsertInternalMutation = internalMutation({
  args: {
    userId: v.string(),
    organizationId: v.string(),
    username: v.optional(v.string()),
    preferredLoginName: v.optional(v.string()),
    displayName: v.optional(v.string()),
    email: v.optional(v.string()),
    state: v.optional(v.number()),
    isHuman: v.optional(v.boolean()),
    roles: v.array(v.string()),
    teamIds: v.array(v.string()),
    syncedAt: v.string(),
  },
  handler: async (ctx, args): PromiseResult<{ readonly id: string; readonly updated: boolean }> => {
    // Composite projection identity: (organizationId, userId)
    const existing = await ctx.db
      .query("userProjections")
      .withIndex("orgIdAndUserId", (q) => q.eq("organizationId", args.organizationId).eq("userId", args.userId))
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, {
        organizationId: args.organizationId,
        username: args.username,
        preferredLoginName: args.preferredLoginName,
        displayName: args.displayName,
        email: args.email,
        state: args.state,
        isHuman: args.isHuman,
        roles: args.roles,
        teamIds: args.teamIds,
        syncedAt: args.syncedAt,
      })
      return createResult({ id: existing._id, updated: true })
    }

    const newId = await ctx.db.insert("userProjections", {
      userId: args.userId,
      organizationId: args.organizationId,
      username: args.username,
      preferredLoginName: args.preferredLoginName,
      displayName: args.displayName,
      email: args.email,
      state: args.state,
      isHuman: args.isHuman,
      roles: args.roles,
      teamIds: args.teamIds,
      syncedAt: args.syncedAt,
    })
    return createResult({ id: newId, updated: false })
  },
})
