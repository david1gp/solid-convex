import * as a from "valibot"
import { createResult, createResultError, type Result } from "#result"
import { teamUrlContextSchema } from "#src/team/url/teamUrlContextSchema.ts"

export function teamUrlBuild(input: unknown): Result<string> {
  const op = "teamUrlBuild"
  const parsed = a.safeParse(teamUrlContextSchema, input)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  const context = parsed.output
  const list = context.orgHandle ? `/org/${encodeURIComponent(context.orgHandle)}/team` : "/team"
  if (context.view === "list") return createResult(list)
  if (context.view === "create") return createResult(`${list}/create`)
  const detail = `${list}/${encodeURIComponent(context.teamId)}`
  if (context.view === "edit") return createResult(`${detail}/edit`)
  return createResult(detail)
}
