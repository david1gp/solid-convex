import { query } from "#convex/_generated/server.js"
import { createResult, createResultError } from "#result"
import { projectContextFields } from "#src/project/convex/projectContextFields.ts"
import { projectGetFn } from "#src/project/convex/projectGetFn.ts"
import type { Project } from "#src/project/model/projectSchema.ts"
import { teamGetFn } from "#src/team/convex/teamGetFn.ts"
import { teamOrgResolveFn } from "#src/team/convex/teamOrgResolveFn.ts"
import { authQueryResult } from "#src/utils/convex_backend/authQueryResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"
import { paginationDefaultOptions } from "#src/utils/convex_backend/paginationDefaultOptions.ts"
import { paginationOptsValidator } from "#src/utils/convex_backend/paginationOptsValidator.ts"

export const projectListQuery = query({
  args: createTokenValidator({ ...projectContextFields, paginationOpts: paginationOptsValidator }),
  handler: (ctx, args) =>
    authQueryResult(ctx, args, async (ctx, data) => {
      const op = "projectListQuery"
      const pagination = data.paginationOpts ?? paginationDefaultOptions
      if (!Number.isInteger(pagination.numItems) || pagination.numItems < 1 || pagination.numItems > 100) {
        return createResultError(op, "Page size must be an integer between 1 and 100")
      }
      const team = data.teamId !== undefined ? await teamGetFn(ctx, { ...data, teamId: data.teamId }) : undefined
      if (team && !team.success) return team
      const org =
        !team && (data.orgId !== undefined || data.orgHandle !== undefined)
          ? await teamOrgResolveFn(ctx, data)
          : undefined
      if (org && !org.success) return org
      const projects = team
        ? ctx.db.query("projects").withIndex("teamId", (q) => q.eq("teamId", team.data.teamId))
        : org
          ? ctx.db.query("projects").withIndex("orgId", (q) => q.eq("orgId", org.data._id))
          : ctx.db.query("projects").withIndex("by_creation_time")
      let result
      try {
        result = await projects.paginate({ ...pagination, maximumRowsRead: 100 })
      } catch (error) {
        return createResultError(op, "Project pagination failed", String(error))
      }
      const page: Project[] = []
      // Validate each bounded page's ancestry, including stored derived orgId. Never silently skip invalid rows.
      for (const project of result.page) {
        const resolved = await projectGetFn(ctx, { ...data, projectId: project._id })
        if (!resolved.success) return resolved
        page.push(resolved.data)
      }
      return createResult({ page, isDone: result.isDone, continueCursor: result.continueCursor })
    }),
})
