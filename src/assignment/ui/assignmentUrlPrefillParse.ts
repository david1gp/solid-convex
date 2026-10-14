import * as a from "valibot"
import type { AssignmentTargetKind } from "#src/assignment/model/assignmentTargetKindSchema.ts"
import type { AssignmentTarget } from "#src/assignment/model/assignmentTargetSchema.ts"
import { assignmentTargetCanonicalBuild } from "#src/assignment/ui/assignmentTargetCanonicalBuild.ts"
import { assignmentUrlQuerySchema } from "#src/assignment/ui/assignmentUrlQuerySchema.ts"

export interface AssignmentPrefillResult {
  kind: AssignmentTargetKind | "unassigned"
  orgId?: string
  teamId?: string
  projectId?: string
  noteId?: string
  target?: AssignmentTarget
}

export function assignmentUrlPrefillParse(params: URLSearchParams | string): AssignmentPrefillResult {
  const searchParams = typeof params === "string" ? new URLSearchParams(params.replace(/^\?/, "")) : params

  const raw = {
    orgId: searchParams.get("orgId")?.trim() || undefined,
    teamId: searchParams.get("teamId")?.trim() || undefined,
    projectId: searchParams.get("projectId")?.trim() || undefined,
    noteId: searchParams.get("noteId")?.trim() || undefined,
    assignmentKind: searchParams.get("assignmentKind")?.trim() || undefined,
    assignmentId: searchParams.get("assignmentId")?.trim() || undefined,
  }

  const parseResult = a.safeParse(assignmentUrlQuerySchema, raw)
  if (!parseResult.success) {
    return {
      kind: "unassigned",
    }
  }

  const { orgId, teamId, projectId, noteId, assignmentKind, assignmentId } = parseResult.output

  if (assignmentKind === "unassigned") {
    return {
      kind: "unassigned",
      orgId,
      teamId,
      projectId,
      noteId,
    }
  }

  if (assignmentKind && assignmentId) {
    const buildRes = assignmentTargetCanonicalBuild(assignmentKind, assignmentId)
    if (buildRes.success && buildRes.data) {
      return {
        kind: buildRes.data.kind,
        orgId: buildRes.data.kind === "organization" ? assignmentId : orgId,
        teamId: buildRes.data.kind === "team" ? assignmentId : teamId,
        projectId: buildRes.data.kind === "project" ? assignmentId : projectId,
        noteId: buildRes.data.kind === "note" ? assignmentId : noteId,
        target: buildRes.data,
      }
    }
  }

  if (noteId) {
    const targetRes = assignmentTargetCanonicalBuild("note", noteId)
    return {
      kind: "note",
      orgId,
      teamId,
      projectId,
      noteId,
      target: targetRes.success ? targetRes.data : undefined,
    }
  }

  if (projectId) {
    const targetRes = assignmentTargetCanonicalBuild("project", projectId)
    return {
      kind: "project",
      orgId,
      teamId,
      projectId,
      target: targetRes.success ? targetRes.data : undefined,
    }
  }

  if (teamId) {
    const targetRes = assignmentTargetCanonicalBuild("team", teamId)
    return {
      kind: "team",
      orgId,
      teamId,
      target: targetRes.success ? targetRes.data : undefined,
    }
  }

  if (orgId) {
    const targetRes = assignmentTargetCanonicalBuild("organization", orgId)
    return {
      kind: "organization",
      orgId,
      target: targetRes.success ? targetRes.data : undefined,
    }
  }

  return {
    kind: "unassigned",
  }
}
