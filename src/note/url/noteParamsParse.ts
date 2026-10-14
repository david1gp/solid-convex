import * as a from "valibot"
import { createResult, createResultError, type Result } from "#result"
import { type NoteParams, noteParamsSchema } from "#src/note/url/noteParamsSchema.ts"

export function noteParamsParse(input: unknown): Result<NoteParams> {
  const op = "noteParamsParse"
  const parsed = a.safeParse(noteParamsSchema, input)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
  return createResult(parsed.output)
}
