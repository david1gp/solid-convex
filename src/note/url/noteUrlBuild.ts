import * as a from "valibot"
import { createResult, createResultError, type Result } from "#result"
import { noteUrlContextSchema } from "#src/note/url/noteUrlContextSchema.ts"

export function noteUrlBuild(input: unknown): Result<string> {
  const op = "noteUrlBuild"
  const parsed = a.safeParse(noteUrlContextSchema, input)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const context = parsed.output
  const org = context.orgHandle ? `/org/${encodeURIComponent(context.orgHandle)}` : ""
  const team = context.teamId ? `/team/${encodeURIComponent(context.teamId)}` : ""
  const project = context.projectId ? `/project/${encodeURIComponent(context.projectId)}` : ""
  const list = `${org}${team}${project}/note`
  if (context.view === "list") return createResult(list)
  if (context.view === "create") return createResult(`${list}/create`)
  const detail = `${list}/${encodeURIComponent(context.noteId)}`
  if (context.view === "edit") return createResult(`${detail}/edit`)
  return createResult(detail)
}
