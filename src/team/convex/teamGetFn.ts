import type { Id } from "#convex/_generated/dataModel.js"
import type { MutationCtx, QueryCtx } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import { teamDocToModel } from "#src/team/convex/teamDocToModel.ts"
import { teamOrgResolveFn } from "#src/team/convex/teamOrgResolveFn.ts"
import type { Team } from "#src/team/model/teamSchema.ts"

export async function teamGetFn(
  ctx: QueryCtx | MutationCtx,
  args: { teamId: Id<"teams"> | string; orgId?: Id<"orgs"> | string; orgHandle?: string },
): PromiseResult<Team> {
  const op = "teamGetFn"
  const normalizedTeamId = ctx.db.normalizeId("teams", args.teamId)
  if (!normalizedTeamId) return createResultError(op, "Team not found")
  const team = await ctx.db.get("teams", normalizedTeamId)
  if (!team) return createResultError(op, "Team not found")
  if (team.deleting) {
    return createResultError(op, "Team is currently being deleted")
  }
  if (args.orgId !== undefined) {
    const normalizedOrgId = ctx.db.normalizeId("orgs", args.orgId)
    if (!normalizedOrgId || normalizedOrgId !== team.orgId) {
      return createResultError(op, "Team does not belong to this organization")
    }
  }
  const org = await teamOrgResolveFn(ctx, { orgId: team.orgId, orgHandle: args.orgHandle })
  if (!org.success) return org
  return createResult(teamDocToModel(team))
}
