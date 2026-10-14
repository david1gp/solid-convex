import * as a from "valibot"
import { mutation } from "#convex/_generated/server.js"
import { createResult, createResultError } from "#result"
import { projectDataSchema } from "#src/project/model/projectDataSchema.ts"
import { teamGetFn } from "#src/team/convex/teamGetFn.ts"
import { teamOrgContextFields } from "#src/team/convex/teamOrgContextFields.ts"
import { vIdTeam } from "#src/team/convex/vIdTeam.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authMutationResult } from "#src/utils/convex_backend/authMutationResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"
import { nowIso } from "#utils/date/nowIso.js"

export const projectCreateMutation = mutation({
  args: createTokenValidator({
    teamId: vIdTeam,
    ...teamOrgContextFields,
    ...valibotToConvex(projectDataSchema.entries),
  }),
  handler: (ctx, args) =>
    authMutationResult(ctx, args, async (ctx, data) => {
      const op = "projectCreateMutation"
      const parsed = a.safeParse(projectDataSchema, data)
      if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
      const team = await teamGetFn(ctx, data)
      if (!team.success) return team
      const now = nowIso()
      const projectId = await ctx.db.insert("projects", {
        ...parsed.output,
        teamId: team.data.teamId,
        orgId: team.data.orgId,
        createdAt: now,
        updatedAt: now,
      })
      console.info(op, { projectId, teamId: team.data.teamId, orgId: team.data.orgId })
      return createResult(projectId)
    }),
})
