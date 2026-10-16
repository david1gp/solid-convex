import { v } from "convex/values"
import * as a from "valibot"
import type { Id } from "#convex/_generated/dataModel.js"
import { query } from "#convex/_generated/server.js"
import { createResult, createResultError } from "#result"
import { hierarchyDeleteJobDocToModel } from "#src/hierarchy_delete/convex/hierarchyDeleteJobDocToModel.ts"
import { hierarchyDeleteRootResolveFn } from "#src/hierarchy_delete/convex/hierarchyDeleteRootResolveFn.ts"
import { hierarchyDeleteTargetSchema } from "#src/hierarchy_delete/model/hierarchyDeleteTargetSchema.ts"
import { vIdNote } from "#src/note/convex/vIdNote.ts"
import { vIdOrg } from "#src/org/org_convex/vIdOrg.ts"
import { vIdProject } from "#src/project/convex/vIdProject.ts"
import { vIdTeam } from "#src/team/convex/vIdTeam.ts"
import { userAdminCheckFn } from "#src/user_management/convex/userAdminCheckFn.ts"
import { authCredentialResolve } from "#src/utils/convex_backend/authCredentialResolve.ts"
import { authQueryResult } from "#src/utils/convex_backend/authQueryResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"

export const hierarchyDeleteStatusQuery = query({
  args: createTokenValidator({
    jobId: v.optional(v.string()),
    kind: v.optional(v.union(v.literal("org"), v.literal("team"), v.literal("project"), v.literal("note"))),
    orgId: v.optional(vIdOrg),
    orgHandle: v.optional(v.string()),
    teamId: v.optional(vIdTeam),
    projectId: v.optional(vIdProject),
    noteId: v.optional(vIdNote),
    limit: v.optional(v.number()),
  }),
  handler: (ctx, args) =>
    authQueryResult(ctx, args, async (ctx, data) => {
      const op = "hierarchyDeleteStatusQuery"

      // 1. If jobId is provided, lookup specific job
      if (data.jobId) {
        const job = await ctx.db.get("hierarchyDeleteJobs", data.jobId as Id<"hierarchyDeleteJobs">)
        if (!job) {
          return createResultError(op, "Deletion job not found")
        }
        return createResult({
          job: hierarchyDeleteJobDocToModel(job),
          jobs: [hierarchyDeleteJobDocToModel(job)],
        })
      }

      // 2. If target entity is provided, lookup latest job for root
      if (data.kind) {
        const parsed = a.safeParse(hierarchyDeleteTargetSchema, {
          kind: data.kind,
          orgId: data.orgId,
          orgHandle: data.orgHandle,
          teamId: data.teamId,
          projectId: data.projectId,
          noteId: data.noteId,
        })
        if (!parsed.success) {
          return createResultError(op, "Invalid hierarchy delete target: " + JSON.stringify(parsed.issues))
        }

        const rootResult = await hierarchyDeleteRootResolveFn(ctx, parsed.output)
        if (!rootResult.success) {
          return rootResult
        }

        const job = await ctx.db
          .query("hierarchyDeleteJobs")
          .withIndex("rootId", (q) => q.eq("rootId", rootResult.data.id))
          .order("desc")
          .first()

        const model = job ? hierarchyDeleteJobDocToModel(job) : null
        return createResult({
          job: model,
          jobs: model ? [model] : [],
        })
      }

      // 3. Neither jobId nor target: list recent jobs (admin sees all, signed-in sees own)
      const credential = await authCredentialResolve(ctx, args.token)
      if (!credential.success) {
        return credential
      }

      const adminCheck = await userAdminCheckFn(ctx, args.token)
      const isAdmin = adminCheck.success

      if (isAdmin) {
        const jobs = await ctx.db.query("hierarchyDeleteJobs").order("desc").take(50)
        const models = jobs.map(hierarchyDeleteJobDocToModel)
        return createResult({
          job: models[0] ?? null,
          jobs: models,
        })
      }

      const jobs = await ctx.db
        .query("hierarchyDeleteJobs")
        .filter((q) => q.eq(q.field("requestedByUserId"), String(credential.data.userId)))
        .order("desc")
        .take(50)

      const models = jobs.map(hierarchyDeleteJobDocToModel)
      return createResult({
        job: models[0] ?? null,
        jobs: models,
      })
    }),
})
