import { v } from "convex/values"
import * as a from "valibot"
import { internalMutation } from "#convex/_generated/server.js"
import { createResult, createResultError } from "#result"
import { authSessionE2eCallerAuthorize } from "./authSessionE2eCallerAuthorize.ts"
import { authSessionE2eOwnershipSchema } from "./authSessionE2eOwnershipSchema.ts"

export const authSessionE2eRunCleanupInternalMutation = internalMutation({
  args: { e2eRunId: v.string(), ownedAt: v.number(), createdBefore: v.optional(v.number()) },
  handler: async (ctx, { createdBefore, ...ownership }) => {
    const op = "authSessionE2eRunCleanupInternalMutation"
    const parsed = a.safeParse(authSessionE2eOwnershipSchema, ownership)
    if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
    const authorized = await authSessionE2eCallerAuthorize(ctx)
    if (!authorized.success) return authorized
    if (
      createdBefore !== undefined &&
      (!Number.isSafeInteger(createdBefore) ||
        createdBefore > Date.now() - 86_400_000 ||
        ownership.ownedAt >= createdBefore)
    ) {
      return createResultError(op, "Run must be strictly older than the stale cutoff (at least 24 hours ago)")
    }
    const sessionsQuery = () =>
      ctx.db
        .query("authSessions")
        .withIndex("userIdAndE2eRun", (q) =>
          q.eq("userId", authorized.data.userId).eq("e2eRunId", ownership.e2eRunId).eq("e2eOwnedAt", ownership.ownedAt),
        )
    const sessions = await sessionsQuery().take(100)
    let deletedCount = 0
    for (const session of sessions) {
      if (
        createdBefore !== undefined &&
        (!Number.isFinite(Date.parse(session.createdAt)) ||
          Date.parse(session.createdAt) >= createdBefore ||
          session._creationTime >= createdBefore)
      )
        continue
      await ctx.db.delete("authSessions", session._id)
      deletedCount += 1
    }
    // Read-after-delete in the same transaction proves exact-run absence; repeat bounded batches until true.
    const remaining = await sessionsQuery().first()
    if (deletedCount) console.info(op, { e2eRunId: ownership.e2eRunId, deletedCount })
    return createResult({ deletedCount, verifiedAbsent: remaining === null })
  },
})
