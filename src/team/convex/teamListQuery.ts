import { query } from "#convex/_generated/server.js"
import { createResult, createResultError } from "#result"
import { teamDocToModel } from "#src/team/convex/teamDocToModel.ts"
import { teamOrgContextFields } from "#src/team/convex/teamOrgContextFields.ts"
import { teamOrgResolveFn } from "#src/team/convex/teamOrgResolveFn.ts"
import { authQueryResult } from "#src/utils/convex_backend/authQueryResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"
import { paginationDefaultOptions } from "#src/utils/convex_backend/paginationDefaultOptions.ts"
import { paginationOptsValidator } from "#src/utils/convex_backend/paginationOptsValidator.ts"
import { paginationResultMap } from "#src/utils/convex_backend/paginationResultMap.ts"

export const teamListQuery = query({
  args: createTokenValidator({ ...teamOrgContextFields, paginationOpts: paginationOptsValidator }),
  handler: (ctx, args) =>
    authQueryResult(ctx, args, async (ctx, data) => {
      const op = "teamListQuery"
      const pagination = data.paginationOpts ?? paginationDefaultOptions
      if (!Number.isInteger(pagination.numItems) || pagination.numItems < 1 || pagination.numItems > 100) {
        return createResultError(op, "Page size must be an integer between 1 and 100")
      }
      const org =
        data.orgId !== undefined || data.orgHandle !== undefined ? await teamOrgResolveFn(ctx, data) : undefined
      if (org && !org.success) return org
      const teams = org
        ? ctx.db.query("teams").withIndex("orgId", (q) => q.eq("orgId", org.data._id))
        : ctx.db.query("teams").withIndex("by_creation_time")
      try {
        const result = await teams.paginate({ ...pagination, maximumRowsRead: 100 })
        return createResult(paginationResultMap(result, teamDocToModel))
      } catch (error) {
        return createResultError(op, "Team pagination failed", String(error))
      }
    }),
})
