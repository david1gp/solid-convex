import type { Id } from "#convex/_generated/dataModel.js"
import type { MutationCtx, QueryCtx } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import { noteDocToModel } from "#src/note/convex/noteDocToModel.ts"
import type { Note } from "#src/note/model/noteSchema.ts"
import { projectGetFn } from "#src/project/convex/projectGetFn.ts"

export async function noteGetFn(
  ctx: QueryCtx | MutationCtx,
  args: {
    noteId: Id<"notes"> | string
    projectId?: Id<"projects"> | string
    teamId?: Id<"teams"> | string
    orgId?: Id<"orgs"> | string
    orgHandle?: string
  },
): PromiseResult<Note> {
  const op = "noteGetFn"
  const normalizedNoteId = ctx.db.normalizeId("notes", args.noteId)
  if (!normalizedNoteId) return createResultError(op, "Note not found")
  const note = await ctx.db.get("notes", normalizedNoteId)
  if (!note) return createResultError(op, "Note not found")
  if (note.deleting) {
    return createResultError(op, "Note is currently being deleted")
  }
  if (args.projectId !== undefined) {
    const normalizedProjectId = ctx.db.normalizeId("projects", args.projectId)
    if (!normalizedProjectId || normalizedProjectId !== note.projectId) {
      return createResultError(op, "Note does not belong to this project")
    }
  }
  if (args.teamId !== undefined) {
    const normalizedTeamId = ctx.db.normalizeId("teams", args.teamId)
    if (!normalizedTeamId || normalizedTeamId !== note.teamId) {
      return createResultError(op, "Note does not belong to this team")
    }
  }
  if (args.orgId !== undefined) {
    const normalizedOrgId = ctx.db.normalizeId("orgs", args.orgId)
    if (!normalizedOrgId || normalizedOrgId !== note.orgId) {
      return createResultError(op, "Note does not belong to this organization")
    }
  }
  const project = await projectGetFn(ctx, {
    projectId: note.projectId,
    teamId: note.teamId,
    orgId: note.orgId,
    orgHandle: args.orgHandle,
  })
  if (!project.success) return project
  return createResult(noteDocToModel(note))
}
