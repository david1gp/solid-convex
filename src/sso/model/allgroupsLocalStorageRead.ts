import * as a from "valibot"
import { createResult, createResultError, type Result } from "#result"

/** Reads and validates a JSON value from browser storage. */
export const allgroupsLocalStorageRead = <T>(
  key: string,
  schema: a.GenericSchema<unknown, T>,
  storage?: Storage,
): Result<T | undefined> => {
  const op = "allgroupsLocalStorageRead"
  let raw: string | null
  try {
    const target = storage ?? (typeof globalThis.localStorage === "undefined" ? undefined : globalThis.localStorage)
    if (target === undefined) {
      return createResultError(op, "localStorage is unavailable")
    }
    raw = target.getItem(key)
  } catch (error) {
    const message = error instanceof Error ? error.message : "The storage operation failed"
    return createResultError(op, `Could not read localStorage: ${message}`)
  }

  if (raw === null) return createResult(undefined)

  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return createResultError(op, `The localStorage value for ${key} was not valid JSON`)
  }

  const parsed = a.safeParse(schema, value)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues), String(value))
  return createResult(parsed.output)
}
