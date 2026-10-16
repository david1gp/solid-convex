import { v } from "convex/values"
import { internal } from "#convex/_generated/api.js"
import { internalMutation } from "#convex/_generated/server.js"
import type { PromiseResult } from "#result"
import { createResult } from "#result"

const userRecordValidator = v.object({
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
})

export const userProjectionSyncRecordsInternalMutation = internalMutation({
  args: {
    records: v.array(userRecordValidator),
    organizationId: v.string(),
    isCompleteSync: v.optional(v.boolean()),
  },
  handler: async (
    ctx,
    args,
  ): PromiseResult<{
    readonly upsertedCount: number
    readonly deletedStaleCount: number
  }> => {
    let upsertedCount = 0
    const syncedUserIds = new Set<string>()

    for (const record of args.records) {
      syncedUserIds.add(record.userId)
      // Composite identity: organizationId + userId
      const existing = await ctx.db
        .query("userProjections")
        .withIndex("orgIdAndUserId", (q) => q.eq("organizationId", record.organizationId).eq("userId", record.userId))
        .first()

      if (existing) {
        await ctx.db.patch(existing._id, {
          organizationId: record.organizationId,
          username: record.username,
          preferredLoginName: record.preferredLoginName,
          displayName: record.displayName,
          email: record.email,
          state: record.state,
          isHuman: record.isHuman,
          roles: record.roles,
          teamIds: record.teamIds,
          syncedAt: record.syncedAt,
        })
      } else {
        await ctx.db.insert("userProjections", record)
      }
      upsertedCount += 1
    }

    let deletedStaleCount = 0
    // Server-derived completeness triggers stale cleanup using bounded pagination & continuation
    if (args.isCompleteSync === true) {
      const existingInOrg = await ctx.db
        .query("userProjections")
        .withIndex("organizationId", (q) => q.eq("organizationId", args.organizationId))
        .paginate({ cursor: null, numItems: 100 })

      for (const doc of existingInOrg.page) {
        if (!syncedUserIds.has(doc.userId)) {
          await ctx.db.delete(doc._id)
          deletedStaleCount += 1
        }
      }

      if (!existingInOrg.isDone) {
        await ctx.scheduler.runAfter(0, internal.userManagement.userProjectionStaleCleanupInternalMutation, {
          organizationId: args.organizationId,
          syncedUserIds: Array.from(syncedUserIds),
          cursor: existingInOrg.continueCursor,
        })
      }
    }

    return createResult({
      upsertedCount,
      deletedStaleCount,
    })
  },
})
