import * as a from "valibot"
import { mutation } from "#convex/_generated/server.js"
import { createResult, createResultError } from "#result"
import { projectContextFields } from "#src/project/convex/projectContextFields.ts"
import { projectGetFn } from "#src/project/convex/projectGetFn.ts"
import { vIdProject } from "#src/project/convex/vIdProject.ts"
import { projectDataSchema } from "#src/project/model/projectDataSchema.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authMutationResult } from "#src/utils/convex_backend/authMutationResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"
import { nowIso } from "#utils/date/nowIso.js"

export const projectEditMutation = mutation({
  args: createTokenValidator({
    projectId: vIdProject,
    ...projectContextFields,
    ...valibotToConvex(projectDataSchema.entries),
  }),
  handler: (ctx, args) =>
    authMutationResult(ctx, args, async (ctx, data) => {
      const op = "projectEditMutation"
      const parsed = a.safeParse(projectDataSchema, data)
      if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
      const project = await projectGetFn(ctx, data)
      if (!project.success) return project
      // Full replacement of editable fields; omitting description clears it. Parents are immutable.
      await ctx.db.patch("projects", data.projectId, {
        name: parsed.output.name,
        description: parsed.output.description,
        updatedAt: nowIso(),
      })
      console.info(op, { projectId: data.projectId, teamId: project.data.teamId, orgId: project.data.orgId })
      return createResult(null)
    }),
})
