import dayjs from "dayjs"
import * as a from "valibot"
import { createError, createResult, type Result } from "#result"
import { userProfileSchema } from "#src/auth/model/UserProfile.ts"
import { loginMethodSchema } from "#src/auth/model_field/loginMethod.ts"
import { tokenValidDurationInDays } from "#src/auth/server/jwt_token/tokenValidDurationInDays.ts"
import { tokenSchema } from "#src/utils/valibot/tokenSchema.ts"
import { dateTimeSchema } from "#utils/valibot/dateTimeSchema.js"

export const userSessionSchema = a.object({
  token: tokenSchema,
  profile: userProfileSchema,
  hasPw: a.boolean(),
  signedInMethod: loginMethodSchema,
  signedInAt: dateTimeSchema,
  expiresAt: dateTimeSchema,
})

export type UserSession = a.InferOutput<typeof userSessionSchema>

export const userSessionSchemaFromString = a.pipe(a.string(), a.parseJson(), userSessionSchema)

export function createUserSessionTimes(now = dayjs()): Pick<UserSession, "signedInAt" | "expiresAt"> {
  const signedInAt = now
  const expiresAt = signedInAt.add(tokenValidDurationInDays, "days")
  return {
    signedInAt: signedInAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  }
}

export function userSessionIsStillValid(userSession: UserSession): boolean {
  const expiresAt = dayjs(userSession.expiresAt)
  const now = dayjs()
  const isExpired = expiresAt < now
  return !isExpired
}

export function userSessionParse(op: string, text: string): Result<UserSession> {
  const parsing = a.safeParse(userSessionSchemaFromString, text)
  if (!parsing.success) {
    return createError(op, a.summarize(parsing.issues), text)
  }
  return createResult(parsing.output)
}
