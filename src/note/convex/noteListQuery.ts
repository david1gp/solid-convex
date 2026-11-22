import { query } from "#convex/_generated/server.js"
import { createResult, createResultError } from "#result"
import { noteContextFields } from "#src/note/convex/noteContextFields.ts"
import { noteGetFn } from "#src/note/convex/noteGetFn.ts"
import type { Note } from "#src/note/model/noteSchema.ts"
import { projectGetFn } from "#src/project/convex/projectGetFn.ts"
import { teamGetFn } from "#src/team/convex/teamGetFn.ts"
import { teamOrgResolveFn } from "#src/team/convex/teamOrgResolveFn.ts"
import { authQueryResult } from "#src/utils/convex_backend/authQueryResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"
import { paginationDefaultOptions } from "#src/utils/convex_backend/paginationDefaultOptions.ts"
import { paginationOptsValidator } from "#src/utils/convex_backend/paginationOptsValidator.ts"

export const noteListQuery = query({
  args: createTokenValidator({ ...noteContextFields, paginationOpts: paginationOptsValidator }),
  handler: (ctx, args) =>
    authQueryResult(ctx, args, async (ctx, data) => {
      const op = "noteListQuery"
      const pagination = data.paginationOpts ?? paginationDefaultOptions
      if (!Number.isInteger(pagination.numItems) || pagination.numItems < 1 || pagination.numItems > 100) {
        return createResultError(op, "Page size must be an integer between 1 and 100")
      }
      const project =
        data.projectId !== undefined ? await projectGetFn(ctx, { ...data, projectId: data.projectId }) : undefined
      if (project && !project.success) return project

      const team =
        !project && data.teamId !== undefined ? await teamGetFn(ctx, { ...data, teamId: data.teamId }) : undefined
      if (team && !team.success) return team

      const org =
        !project && !team && (data.orgId !== undefined || data.orgHandle !== undefined)
          ? await teamOrgResolveFn(ctx, data)
          : undefined
      if (org && !org.success) return org

      const notes = project
        ? ctx.db.query("notes").withIndex("projectId", (q) => q.eq("projectId", project.data.projectId))
        : team
          ? ctx.db.query("notes").withIndex("teamId", (q) => q.eq("teamId", team.data.teamId))
          : org
            ? ctx.db.query("notes").withIndex("orgId", (q) => q.eq("orgId", org.data._id))
            : ctx.db.query("notes").withIndex("by_creation_time")

      let result: Awaited<ReturnType<typeof notes.paginate>>
      try {
        result = await notes.paginate({ ...pagination, maximumRowsRead: 100 })
      } catch (error) {
        return createResultError(op, "Note pagination failed", String(error))
      }
      const page: Note[] = []
      for (const note of result.page) {
        // A deleting note must not make the entire list unavailable while its job runs.
        if (note.deleting) continue
        const resolved = await noteGetFn(ctx, { ...data, noteId: note._id })
        if (!resolved.success) return resolved
        page.push(resolved.data)
      }
      return createResult({ page, isDone: result.isDone, continueCursor: result.continueCursor })
    }),
})
