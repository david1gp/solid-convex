import { v } from "convex/values"
import { query } from "#convex/_generated/server.js"
import { createResult, createResultError } from "#result"
import { userAdminCheckFn } from "#src/user_management/convex/userAdminCheckFn.ts"
import { userProjectionDocToModel } from "#src/user_management/convex/userProjectionDocToModel.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"

export const userProjectionGetQuery = query({
  args: createTokenValidator({
    userId: v.string(),
    organizationId: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const op = "userProjectionGetQuery"
    const adminResult = await userAdminCheckFn(ctx, args.token)
    if (!adminResult.success) {
      return adminResult
    }

    const doc =
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

    if (!doc) {
      return createResultError(op, `User projection not found for userId: ${args.userId}`)
    }

    return createResult(userProjectionDocToModel(doc))
  },
})
