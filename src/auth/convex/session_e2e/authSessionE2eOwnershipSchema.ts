import * as a from "valibot"

export const authSessionE2eOwnershipSchema = a.strictObject({
  e2eRunId: a.pipe(a.string(), a.minLength(1), a.maxLength(200), a.regex(/^[a-zA-Z0-9_-]+$/)),
  // Original checkpoint creation time in epoch milliseconds. Never refreshed on resume.
  ownedAt: a.pipe(a.number(), a.integer(), a.minValue(1)),
})
