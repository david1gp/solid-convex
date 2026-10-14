import * as a from "valibot"
import { createResult, createResultError } from "#result"

export function noteStorageRead<T>(key: string, schema: a.BaseSchema<unknown, T, a.BaseIssue<unknown>>) {
  const op = "noteStorageRead"
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return createResultError(op, "No saved data")
    const parsed = a.safeParse(a.pipe(a.string(), a.parseJson(), schema), raw)
    if (!parsed.success) return createResultError(op, a.summarize(parsed.issues))
    return createResult(parsed.output)
  } catch (error) {
    return createResultError(op, "Saved data unavailable", String(error))
  }
}
