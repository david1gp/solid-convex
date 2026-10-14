import * as a from "valibot"
import { mutation } from "#convex/_generated/server.js"
import { createResult, createResultError } from "#result"
import { teamOrgContextFields } from "#src/team/convex/teamOrgContextFields.ts"
import { teamOrgResolveFn } from "#src/team/convex/teamOrgResolveFn.ts"
import { teamDataSchema } from "#src/team/model/teamDataSchema.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authMutationResult } from "#src/utils/convex_backend/authMutationResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"
import { nowIso } from "#utils/date/nowIso.js"

export const teamCreateMutation = mutation({
  args: createTokenValidator({
    ...teamOrgContextFields,
    ...valibotToConvex(teamDataSchema.entries),
  }),
  handler: (ctx, args) =>
    authMutationResult(ctx, args, async (ctx, data) => {
      const op = "teamCreateMutation"
      const parsed = a.safeParse(teamDataSchema, data)
      if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
      const org = await teamOrgResolveFn(ctx, data)
      if (!org.success) return org
      const now = nowIso()
      const teamId = await ctx.db.insert("teams", {
        ...parsed.output,
        orgId: org.data._id,
        createdAt: now,
        updatedAt: now,
      })
      console.info(op, { teamId, orgId: org.data._id })
      return createResult(teamId)
    }),
})
