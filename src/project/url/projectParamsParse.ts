import * as a from "valibot"
import { createResult, createResultError, type Result } from "#result"
import { type ProjectParams, projectParamsSchema } from "#src/project/url/projectParamsSchema.ts"

export function projectParamsParse(input: unknown): Result<ProjectParams> {
  const op = "projectParamsParse"
  const parsed = a.safeParse(projectParamsSchema, input)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  return createResult(parsed.output)
}
