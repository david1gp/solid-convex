import { v } from "convex/values"
import { query } from "#convex/_generated/server.js"
import { createResult, createResultError } from "#result"
import { userAdminCheckFn } from "#src/user_management/convex/userAdminCheckFn.ts"
import { userProjectionDocToModel } from "#src/user_management/convex/userProjectionDocToModel.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"
import { paginationDefaultOptions } from "#src/utils/convex_backend/paginationDefaultOptions.ts"
import { paginationOptsValidator } from "#src/utils/convex_backend/paginationOptsValidator.ts"
import { paginationResultMap } from "#src/utils/convex_backend/paginationResultMap.ts"

export const userProjectionListQuery = query({
  args: createTokenValidator({
    organizationId: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  }),
  handler: async (ctx, args) => {
    const op = "userProjectionListQuery"
    const adminResult = await userAdminCheckFn(ctx, args.token)
    if (!adminResult.success) {
      return adminResult
    }

    const pagination = args.paginationOpts ?? paginationDefaultOptions
    if (!Number.isInteger(pagination.numItems) || pagination.numItems < 1 || pagination.numItems > 100) {
      return createResultError(op, "Page size must be an integer between 1 and 100")
    }

    const queryBuilder =
      args.organizationId !== undefined
        ? ctx.db
            .query("userProjections")
            .withIndex("organizationId", (q) => q.eq("organizationId", args.organizationId as string))
        : ctx.db.query("userProjections").withIndex("by_creation_time")

    try {
      const result = await queryBuilder.paginate({
        ...pagination,
        maximumRowsRead: 100,
      })
      return createResult(paginationResultMap(result, userProjectionDocToModel))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return createResultError(op, "User projection pagination failed", message)
    }
  },
})
