import type { MutationCtx, QueryCtx } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import type { HierarchyDeleteResolvedRoot } from "#src/hierarchy_delete/model/hierarchyDeleteResolvedRootSchema.ts"
import type { HierarchyDeleteTarget } from "#src/hierarchy_delete/model/hierarchyDeleteTargetSchema.ts"
import { orgGetByHandleFn } from "#src/org/org_convex/orgGetByHandleFn.ts"

export async function hierarchyDeleteRootResolveFn(
  ctx: QueryCtx | MutationCtx,
  target: HierarchyDeleteTarget,
): PromiseResult<HierarchyDeleteResolvedRoot> {
  const op = "hierarchyDeleteRootResolveFn"

  if (target.kind === "org") {
    if (!target.orgId && !target.orgHandle) {
      return createResultError(op, "Organization ID or handle is required")
    }
    let org = null
    if (target.orgId) {
      const normalizedOrgId = ctx.db.normalizeId("orgs", target.orgId)
      if (!normalizedOrgId) {
        return createResultError(op, "Organization not found")
      }
      org = await ctx.db.get("orgs", normalizedOrgId)
      if (!org) {
        return createResultError(op, "Organization not found")
      }
      if (target.orgHandle !== undefined && org.orgHandle !== target.orgHandle) {
        return createResultError(op, "Organization context does not match")
      }
    } else {
      org = await orgGetByHandleFn(ctx, target.orgHandle!)
      if (!org) {
        return createResultError(op, "Organization not found")
      }
    }
    return createResult({
      kind: "org",
      id: org._id,
      name: org.name ?? org.orgHandle,
      orgHandle: org.orgHandle,
    })
  }

  if (target.kind === "team") {
    if (!target.teamId) {
      return createResultError(op, "Team ID is required")
    }
    const normalizedTeamId = ctx.db.normalizeId("teams", target.teamId)
    if (!normalizedTeamId) {
      return createResultError(op, "Team not found")
    }
    const team = await ctx.db.get("teams", normalizedTeamId)
    if (!team) {
      return createResultError(op, "Team not found")
    }

    if (target.orgId !== undefined) {
      const normalizedOrgId = ctx.db.normalizeId("orgs", target.orgId)
      if (!normalizedOrgId || normalizedOrgId !== team.orgId) {
        return createResultError(op, "Team does not belong to this organization")
      }
    }

    const org = await ctx.db.get("orgs", team.orgId)
    if (!org) {
      return createResultError(op, "Organization not found")
    }
    if (target.orgHandle !== undefined && org.orgHandle !== target.orgHandle) {
      return createResultError(op, "Team does not belong to this organization")
    }

    return createResult({
      kind: "team",
      id: team._id,
      name: team.name,
      orgHandle: undefined,
    })
  }

  if (target.kind === "project") {
    if (!target.projectId) {
      return createResultError(op, "Project ID is required")
    }
    const normalizedProjectId = ctx.db.normalizeId("projects", target.projectId)
    if (!normalizedProjectId) {
      return createResultError(op, "Project not found")
    }
    const project = await ctx.db.get("projects", normalizedProjectId)
    if (!project) {
      return createResultError(op, "Project not found")
    }

    if (target.teamId !== undefined) {
      const normalizedTeamId = ctx.db.normalizeId("teams", target.teamId)
      if (!normalizedTeamId || normalizedTeamId !== project.teamId) {
        return createResultError(op, "Project does not belong to this team")
      }
    }

    if (target.orgId !== undefined) {
      const normalizedOrgId = ctx.db.normalizeId("orgs", target.orgId)
      if (!normalizedOrgId || normalizedOrgId !== project.orgId) {
        return createResultError(op, "Project does not belong to this organization")
      }
    }

    const team = await ctx.db.get("teams", project.teamId)
    if (!team || team.orgId !== project.orgId) {
      return createResultError(op, "Project does not belong to this organization")
    }

    const org = await ctx.db.get("orgs", project.orgId)
    if (!org) {
      return createResultError(op, "Organization not found")
    }
    if (target.orgHandle !== undefined && org.orgHandle !== target.orgHandle) {
      return createResultError(op, "Project does not belong to this organization")
    }

    return createResult({
      kind: "project",
      id: project._id,
      name: project.name,
      orgHandle: undefined,
    })
  }

  if (target.kind === "note") {
    if (!target.noteId) {
      return createResultError(op, "Note ID is required")
    }
    const normalizedNoteId = ctx.db.normalizeId("notes", target.noteId)
    if (!normalizedNoteId) {
      return createResultError(op, "Note not found")
    }
    const note = await ctx.db.get("notes", normalizedNoteId)
    if (!note) {
      return createResultError(op, "Note not found")
    }

    if (target.projectId !== undefined) {
      const normalizedProjectId = ctx.db.normalizeId("projects", target.projectId)
      if (!normalizedProjectId || normalizedProjectId !== note.projectId) {
        return createResultError(op, "Note does not belong to this project")
      }
    }

    if (target.teamId !== undefined) {
      const normalizedTeamId = ctx.db.normalizeId("teams", target.teamId)
      if (!normalizedTeamId || normalizedTeamId !== note.teamId) {
        return createResultError(op, "Note does not belong to this team")
      }
    }

    if (target.orgId !== undefined) {
      const normalizedOrgId = ctx.db.normalizeId("orgs", target.orgId)
      if (!normalizedOrgId || normalizedOrgId !== note.orgId) {
        return createResultError(op, "Note does not belong to this organization")
      }
    }

    const project = await ctx.db.get("projects", note.projectId)
    if (!project || project.teamId !== note.teamId || project.orgId !== note.orgId) {
      return createResultError(op, "Note does not belong to this project")
    }

    const team = await ctx.db.get("teams", note.teamId)
    if (!team || team.orgId !== note.orgId) {
      return createResultError(op, "Note does not belong to this team")
    }

    const org = await ctx.db.get("orgs", note.orgId)
    if (!org) {
      return createResultError(op, "Organization not found")
    }
    if (target.orgHandle !== undefined && org.orgHandle !== target.orgHandle) {
      return createResultError(op, "Note does not belong to this organization")
    }

    return createResult({
      kind: "note",
      id: note._id,
      name: note.title,
      orgHandle: undefined,
    })
  }

  return createResultError(op, "Invalid target kind")
}
