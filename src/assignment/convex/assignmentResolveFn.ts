import * as a from "valibot"
import type { Id } from "#convex/_generated/dataModel.js"
import type { MutationCtx, QueryCtx } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import { assignmentTargetSchema, type AssignmentTarget } from "#src/assignment/model/assignmentTargetSchema.ts"
import type { ResolvedAssignment } from "#src/assignment/model/resolvedAssignmentSchema.ts"
import { hierarchyDeleteAncestryGuardFn } from "#src/hierarchy_delete/convex/hierarchyDeleteAncestryGuardFn.ts"
import { noteGetFn } from "#src/note/convex/noteGetFn.ts"
import { projectGetFn } from "#src/project/convex/projectGetFn.ts"
import { teamGetFn } from "#src/team/convex/teamGetFn.ts"
import { teamOrgResolveFn } from "#src/team/convex/teamOrgResolveFn.ts"

export type AssignmentResolveArgs = {
  assignment?: AssignmentTarget | undefined
  orgId?: Id<"orgs"> | undefined
  teamId?: Id<"teams"> | undefined
  projectId?: Id<"projects"> | undefined
  noteId?: Id<"notes"> | undefined
  orgHandle?: string | undefined
}

export async function assignmentResolveFn(
  ctx: QueryCtx | MutationCtx,
  args: AssignmentResolveArgs,
): PromiseResult<ResolvedAssignment> {
  const op = "assignmentResolveFn"

  if (args.assignment !== undefined) {
    const parsed = a.safeParse(assignmentTargetSchema, args.assignment)
    if (!parsed.success) {
      return createResultError(op, "Invalid assignment target")
    }

    const { kind, id } = parsed.output

    if (kind === "organization") {
      const normalizedOrgId = ctx.db.normalizeId("orgs", id)
      if (!normalizedOrgId) {
        return createResultError(op, "Organization not found")
      }
      if (args.orgId !== undefined && args.orgId !== normalizedOrgId) {
        return createResultError(op, "Organization ID does not match target assignment")
      }
      if (args.teamId !== undefined || args.projectId !== undefined || args.noteId !== undefined) {
        return createResultError(op, "Cannot specify child context for organization assignment")
      }
      const org = await teamOrgResolveFn(ctx, { orgId: normalizedOrgId, orgHandle: args.orgHandle })
      if (!org.success) return org
      const guard = await hierarchyDeleteAncestryGuardFn(ctx, { kind: "org", id: org.data._id })
      if (!guard.success) return guard
      return createResult({
        assignment: { kind: "organization", id: org.data._id },
        orgId: org.data._id,
        teamId: undefined,
        projectId: undefined,
        noteId: undefined,
      })
    }

    if (kind === "team") {
      const normalizedTeamId = ctx.db.normalizeId("teams", id)
      if (!normalizedTeamId) {
        return createResultError(op, "Team not found")
      }
      if (args.teamId !== undefined && args.teamId !== normalizedTeamId) {
        return createResultError(op, "Team ID does not match target assignment")
      }
      if (args.projectId !== undefined || args.noteId !== undefined) {
        return createResultError(op, "Cannot specify child context for team assignment")
      }
      const team = await teamGetFn(ctx, {
        teamId: normalizedTeamId,
        orgId: args.orgId,
        orgHandle: args.orgHandle,
      })
      if (!team.success) return team
      const guard = await hierarchyDeleteAncestryGuardFn(ctx, { kind: "team", id: normalizedTeamId })
      if (!guard.success) return guard
      return createResult({
        assignment: { kind: "team", id: normalizedTeamId },
        orgId: team.data.orgId,
        teamId: normalizedTeamId,
        projectId: undefined,
        noteId: undefined,
      })
    }

    if (kind === "project") {
      const normalizedProjectId = ctx.db.normalizeId("projects", id)
      if (!normalizedProjectId) {
        return createResultError(op, "Project not found")
      }
      if (args.projectId !== undefined && args.projectId !== normalizedProjectId) {
        return createResultError(op, "Project ID does not match target assignment")
      }
      if (args.noteId !== undefined) {
        return createResultError(op, "Cannot specify child context for project assignment")
      }
      const project = await projectGetFn(ctx, {
        projectId: normalizedProjectId,
        teamId: args.teamId,
        orgId: args.orgId,
        orgHandle: args.orgHandle,
      })
      if (!project.success) return project
      const guard = await hierarchyDeleteAncestryGuardFn(ctx, { kind: "project", id: normalizedProjectId })
      if (!guard.success) return guard
      return createResult({
        assignment: { kind: "project", id: normalizedProjectId },
        orgId: project.data.orgId,
        teamId: project.data.teamId,
        projectId: normalizedProjectId,
        noteId: undefined,
      })
    }

    if (kind === "note") {
      const normalizedNoteId = ctx.db.normalizeId("notes", id)
      if (!normalizedNoteId) {
        return createResultError(op, "Note not found")
      }
      if (args.noteId !== undefined && args.noteId !== normalizedNoteId) {
        return createResultError(op, "Note ID does not match target assignment")
      }
      const note = await noteGetFn(ctx, {
        noteId: normalizedNoteId,
        projectId: args.projectId,
        teamId: args.teamId,
        orgId: args.orgId,
        orgHandle: args.orgHandle,
      })
      if (!note.success) return note
      const guard = await hierarchyDeleteAncestryGuardFn(ctx, { kind: "note", id: normalizedNoteId })
      if (!guard.success) return guard
      return createResult({
        assignment: { kind: "note", id: normalizedNoteId },
        orgId: note.data.orgId,
        teamId: note.data.teamId,
        projectId: note.data.projectId,
        noteId: normalizedNoteId,
      })
    }
  }

  // Fallback: Infer assignment from context if legacy or direct IDs provided
  if (args.noteId !== undefined) {
    const normalizedNoteId = ctx.db.normalizeId("notes", args.noteId)
    if (!normalizedNoteId) {
      return createResultError(op, "Note not found")
    }
    const note = await noteGetFn(ctx, {
      noteId: normalizedNoteId,
      projectId: args.projectId,
      teamId: args.teamId,
      orgId: args.orgId,
      orgHandle: args.orgHandle,
    })
    if (!note.success) return note
    const guard = await hierarchyDeleteAncestryGuardFn(ctx, { kind: "note", id: normalizedNoteId })
    if (!guard.success) return guard
    return createResult({
      assignment: { kind: "note", id: normalizedNoteId },
      orgId: note.data.orgId,
      teamId: note.data.teamId,
      projectId: note.data.projectId,
      noteId: normalizedNoteId,
    })
  }

  if (args.projectId !== undefined) {
    const normalizedProjectId = ctx.db.normalizeId("projects", args.projectId)
    if (!normalizedProjectId) {
      return createResultError(op, "Project not found")
    }
    const project = await projectGetFn(ctx, {
      projectId: normalizedProjectId,
      teamId: args.teamId,
      orgId: args.orgId,
      orgHandle: args.orgHandle,
    })
    if (!project.success) return project
    const guard = await hierarchyDeleteAncestryGuardFn(ctx, { kind: "project", id: normalizedProjectId })
    if (!guard.success) return guard
    return createResult({
      assignment: { kind: "project", id: normalizedProjectId },
      orgId: project.data.orgId,
      teamId: project.data.teamId,
      projectId: normalizedProjectId,
      noteId: undefined,
    })
  }

  if (args.teamId !== undefined) {
    const normalizedTeamId = ctx.db.normalizeId("teams", args.teamId)
    if (!normalizedTeamId) {
      return createResultError(op, "Team not found")
    }
    const team = await teamGetFn(ctx, {
      teamId: normalizedTeamId,
      orgId: args.orgId,
      orgHandle: args.orgHandle,
    })
    if (!team.success) return team
    const guard = await hierarchyDeleteAncestryGuardFn(ctx, { kind: "team", id: normalizedTeamId })
    if (!guard.success) return guard
    return createResult({
      assignment: { kind: "team", id: normalizedTeamId },
      orgId: team.data.orgId,
      teamId: normalizedTeamId,
      projectId: undefined,
      noteId: undefined,
    })
  }

  if (args.orgId !== undefined || args.orgHandle !== undefined) {
    let normalizedOrgId = args.orgId
    if (args.orgId !== undefined) {
      const normalized = ctx.db.normalizeId("orgs", args.orgId)
      if (!normalized) {
        return createResultError(op, "Organization not found")
      }
      normalizedOrgId = normalized
    }
    const org = await teamOrgResolveFn(ctx, { orgId: normalizedOrgId, orgHandle: args.orgHandle })
    if (!org.success) return org
    const guard = await hierarchyDeleteAncestryGuardFn(ctx, { kind: "org", id: org.data._id })
    if (!guard.success) return guard
    return createResult({
      assignment: { kind: "organization", id: org.data._id },
      orgId: org.data._id,
      teamId: undefined,
      projectId: undefined,
      noteId: undefined,
    })
  }

  // Unassigned / legacy
  return createResult({
    assignment: undefined,
    orgId: undefined,
    teamId: undefined,
    projectId: undefined,
    noteId: undefined,
  })
}
