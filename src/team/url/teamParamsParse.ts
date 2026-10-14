import * as a from "valibot"
import { createResult, createResultError, type Result } from "#result"
import { type TeamParams, teamParamsSchema } from "#src/team/url/teamParamsSchema.ts"

export function teamParamsParse(input: unknown): Result<TeamParams> {
  const op = "teamParamsParse"
  const parsed = a.safeParse(teamParamsSchema, input)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  return createResult(parsed.output)
}
