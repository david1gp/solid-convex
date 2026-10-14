import * as a from "valibot"
import { createResult, createResultError, type Result } from "#result"
import { projectUrlContextSchema } from "#src/project/url/projectUrlContextSchema.ts"

export function projectUrlBuild(input: unknown): Result<string> {
  const op = "projectUrlBuild"
  const parsed = a.safeParse(projectUrlContextSchema, input)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const context = parsed.output
  const org = context.orgHandle ? `/org/${encodeURIComponent(context.orgHandle)}` : ""
  const team = context.teamId ? `/team/${encodeURIComponent(context.teamId)}` : ""
  const list = `${org}${team}/project`
  if (context.view === "list") return createResult(list)
  if (context.view === "create") return createResult(`${list}/create`)
  const detail = `${list}/${encodeURIComponent(context.projectId)}`
  if (context.view === "edit") return createResult(`${detail}/edit`)
  return createResult(detail)
}
