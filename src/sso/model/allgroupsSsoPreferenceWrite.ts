import * as a from "valibot"
import { createResult, createResultError, type Result } from "#result"
import { allgroupsSsoAttemptsReset } from "./allgroupsSsoAttemptsReset.ts"
import { allgroupsSsoPreferenceSchema } from "./allgroupsSsoPreferenceSchema.ts"
import { allgroupsSsoStorageKeys } from "./allgroupsSsoStorageKeys.ts"

/** Writes the browser-local automatic sign-in preference and resets the attempt budget. */
export const allgroupsSsoPreferenceWrite = (enabled: boolean, storage?: Storage): Result<true> => {
  const op = "allgroupsSsoPreferenceWrite"
  const parsed = a.safeParse(allgroupsSsoPreferenceSchema, enabled)
  if (!parsed.success) return createResultError(op, a.summarize(parsed.issues), String(enabled))

  try {
    const target = storage ?? (typeof globalThis.localStorage === "undefined" ? undefined : globalThis.localStorage)
    if (target === undefined) {
      return createResultError(op, "localStorage is unavailable")
    }
    target.setItem(allgroupsSsoStorageKeys.preference, JSON.stringify(parsed.output))
  } catch (error) {
    const message = error instanceof Error ? error.message : "The storage operation failed"
    return createResultError(op, `Could not write localStorage: ${message}`)
  }

  const resetResult = allgroupsSsoAttemptsReset(storage)
  if (!resetResult.success) return resetResult

  return createResult(true)
}
