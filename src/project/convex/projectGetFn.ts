import type { Id } from "#convex/_generated/dataModel.js"
import type { MutationCtx, QueryCtx } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import { projectDocToModel } from "#src/project/convex/projectDocToModel.ts"
import type { Project } from "#src/project/model/projectSchema.ts"
import { teamGetFn } from "#src/team/convex/teamGetFn.ts"

export async function projectGetFn(
  ctx: QueryCtx | MutationCtx,
  args: {
    projectId: Id<"projects"> | string
    teamId?: Id<"teams"> | string
    orgId?: Id<"orgs"> | string
    orgHandle?: string
  },
): PromiseResult<Project> {
  const op = "projectGetFn"
  const normalizedProjectId = ctx.db.normalizeId("projects", args.projectId)
  if (!normalizedProjectId) return createResultError(op, "Project not found")
  const project = await ctx.db.get("projects", normalizedProjectId)
  if (!project) return createResultError(op, "Project not found")
  if (project.deleting) {
    return createResultError(op, "Project is currently being deleted")
  }
  if (args.teamId !== undefined) {
    const normalizedTeamId = ctx.db.normalizeId("teams", args.teamId)
    if (!normalizedTeamId || normalizedTeamId !== project.teamId) {
      return createResultError(op, "Project does not belong to this team")
    }
  }
  if (args.orgId !== undefined) {
    const normalizedOrgId = ctx.db.normalizeId("orgs", args.orgId)
    if (!normalizedOrgId || normalizedOrgId !== project.orgId) {
      return createResultError(op, "Project does not belong to this organization")
    }
  }
  const team = await teamGetFn(ctx, {
    teamId: project.teamId,
    orgId: project.orgId,
    orgHandle: args.orgHandle,
  })
  if (!team.success) return team
  return createResult(projectDocToModel(project))
}
