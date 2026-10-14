import type { Id } from "#convex/_generated/dataModel.js"
import type { MutationCtx, QueryCtx } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"

export type HierarchyDeleteAncestryTarget =
  | { kind: "org"; id: Id<"orgs"> }
  | { kind: "team"; id: Id<"teams"> }
  | { kind: "project"; id: Id<"projects"> }
  | { kind: "note"; id: Id<"notes"> }

export async function hierarchyDeleteAncestryGuardFn(
  ctx: QueryCtx | MutationCtx,
  target: HierarchyDeleteAncestryTarget,
): PromiseResult<null> {
  const op = "hierarchyDeleteAncestryGuardFn"

  if (target.kind === "note") {
    const note = await ctx.db.get("notes", target.id)
    if (!note) return createResultError(op, "Note not found")
    if (note.deleting) return createResultError(op, "Note is currently being deleted")

    const project = await ctx.db.get("projects", note.projectId)
    if (!project) return createResultError(op, "Parent project not found")
    if (project.deleting) return createResultError(op, "Parent project is currently being deleted")

    const team = await ctx.db.get("teams", note.teamId)
    if (!team) return createResultError(op, "Parent team not found")
    if (team.deleting) return createResultError(op, "Parent team is currently being deleted")

    const org = await ctx.db.get("orgs", note.orgId)
    if (!org) return createResultError(op, "Parent organization not found")
    if (org.deleting) return createResultError(op, "Parent organization is currently being deleted")

    return createResult(null)
  }

  if (target.kind === "project") {
    const project = await ctx.db.get("projects", target.id)
    if (!project) return createResultError(op, "Project not found")
    if (project.deleting) return createResultError(op, "Project is currently being deleted")

    const team = await ctx.db.get("teams", project.teamId)
    if (!team) return createResultError(op, "Parent team not found")
    if (team.deleting) return createResultError(op, "Parent team is currently being deleted")

    const org = await ctx.db.get("orgs", project.orgId)
    if (!org) return createResultError(op, "Parent organization not found")
    if (org.deleting) return createResultError(op, "Parent organization is currently being deleted")

    return createResult(null)
  }

  if (target.kind === "team") {
    const team = await ctx.db.get("teams", target.id)
    if (!team) return createResultError(op, "Team not found")
    if (team.deleting) return createResultError(op, "Team is currently being deleted")

    const org = await ctx.db.get("orgs", team.orgId)
    if (!org) return createResultError(op, "Parent organization not found")
    if (org.deleting) return createResultError(op, "Parent organization is currently being deleted")

    return createResult(null)
  }

  if (target.kind === "org") {
    const org = await ctx.db.get("orgs", target.id)
    if (!org) return createResultError(op, "Organization not found")
    if (org.deleting) return createResultError(op, "Organization is currently being deleted")

    return createResult(null)
  }

  return createResult(null)
}
