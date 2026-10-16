import { v } from "convex/values"
import { internal } from "#convex/_generated/api.js"
import { internalMutation } from "#convex/_generated/server.js"
import type { PromiseResult } from "#result"
import { createResult } from "#result"

export const userProjectionStaleCleanupInternalMutation = internalMutation({
  args: {
    organizationId: v.string(),
    syncedUserIds: v.array(v.string()),
    cursor: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): PromiseResult<{
    readonly deletedCount: number
    readonly isDone: boolean
  }> => {
    const syncedSet = new Set(args.syncedUserIds)
    const existingInOrg = await ctx.db
      .query("userProjections")
      .withIndex("organizationId", (q) => q.eq("organizationId", args.organizationId))
      .paginate({ cursor: args.cursor, numItems: 100 })

    let deletedCount = 0
    for (const doc of existingInOrg.page) {
      if (!syncedSet.has(doc.userId)) {
        await ctx.db.delete(doc._id)
        deletedCount += 1
      }
    }

    if (!existingInOrg.isDone) {
      await ctx.scheduler.runAfter(0, internal.userManagement.userProjectionStaleCleanupInternalMutation, {
        organizationId: args.organizationId,
        syncedUserIds: args.syncedUserIds,
        cursor: existingInOrg.continueCursor,
      })
    }

    return createResult({
      deletedCount,
      isDone: existingInOrg.isDone,
    })
  },
})
