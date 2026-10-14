import * as a from "valibot"
import { mutation } from "#convex/_generated/server.js"
import { createResult, createResultError } from "#result"
import { teamGetFn } from "#src/team/convex/teamGetFn.ts"
import { teamOrgContextFields } from "#src/team/convex/teamOrgContextFields.ts"
import { vIdTeam } from "#src/team/convex/vIdTeam.ts"
import { teamDataSchema } from "#src/team/model/teamDataSchema.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authMutationResult } from "#src/utils/convex_backend/authMutationResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"
import { nowIso } from "#utils/date/nowIso.js"

export const teamEditMutation = mutation({
  args: createTokenValidator({
    teamId: vIdTeam,
    ...teamOrgContextFields,
    ...valibotToConvex(teamDataSchema.entries),
  }),
  handler: (ctx, args) =>
    authMutationResult(ctx, args, async (ctx, data) => {
      const op = "teamEditMutation"
      const parsed = a.safeParse(teamDataSchema, data)
      if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
      const team = await teamGetFn(ctx, data)
      if (!team.success) return team
      // Full replacement of editable fields; omitting description clears it. Parent is immutable.
      await ctx.db.patch("teams", data.teamId, {
        name: parsed.output.name,
        description: parsed.output.description,
        updatedAt: nowIso(),
      })
      console.info(op, { teamId: data.teamId, orgId: team.data.orgId })
      return createResult(null)
    }),
})
