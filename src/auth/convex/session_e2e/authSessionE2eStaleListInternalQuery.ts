import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import { internalQuery } from "#convex/_generated/server.js"
import { createResult, createResultError } from "#result"
import { authSessionE2eCallerAuthorize } from "./authSessionE2eCallerAuthorize.ts"

export const authSessionE2eStaleListInternalQuery = internalQuery({
  args: { createdBefore: v.number(), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const op = "authSessionE2eStaleListInternalQuery"
    const authorized = await authSessionE2eCallerAuthorize(ctx)
    if (!authorized.success) return authorized
    if (!Number.isSafeInteger(args.createdBefore) || args.createdBefore > Date.now() - 86_400_000) {
      return createResultError(op, "Stale cutoff must be at least 24 hours ago")
    }
    if (
      args.paginationOpts.numItems < 1 ||
      args.paginationOpts.numItems > 100 ||
      !Number.isInteger(args.paginationOpts.numItems)
    ) {
      return createResultError(op, "Page size must be an integer between 1 and 100")
    }
    const result = await ctx.db
      .query("authSessions")
      .withIndex("userIdAndE2eOwnedAt", (q) =>
        q.eq("userId", authorized.data.userId).gt("e2eOwnedAt", 0).lt("e2eOwnedAt", args.createdBefore),
      )
      .paginate({ ...args.paginationOpts, maximumRowsRead: 100 })
    return createResult({
      ...result,
      page: result.page
        // Discover every stale ownership group, even when a later session is too young
        // to delete. Cleanup must retain that row and fail closed, not hide it here.
        .filter((session) => !!session.e2eRunId)
        .map((session) => ({
          sessionId: session._id,
          userId: session.userId,
          e2eRunId: session.e2eRunId!,
          ownedAt: session.e2eOwnedAt!,
          createdAt: session.createdAt,
          creationTime: session._creationTime,
        })),
    })
  },
})
