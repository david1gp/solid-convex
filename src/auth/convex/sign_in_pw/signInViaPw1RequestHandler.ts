import * as a from "valibot"
import { internal } from "#convex/_generated/api.js"
import type { ActionCtx } from "#convex/_generated/server.js"
import { createError } from "#result"
import { apiError } from "#src/api/apiError.ts"
import type { IdUser } from "#src/auth/convex/IdUser.ts"
import { verifyHashedPassword2 } from "#src/auth/convex/pw/verifyHashedPassword.ts"
import { commonApiErrorMessages } from "#src/auth/convex/sign_up/commonApiErrorMessages.ts"
import { docUserToUserProfile } from "#src/auth/convex/user/docUserToUserProfile.ts"
import { signInViaPwSchema } from "#src/auth/model/signInSchema.ts"
import type { UserSession } from "#src/auth/model/UserSession.ts"
import { loginMethod } from "#src/auth/model_field/loginMethod.ts"
import { tokenCreateResult } from "#src/auth/server/jwt_token/tokenCreateResult.ts"
import { nowIso } from "#utils/date/nowIso.js"

export async function signInViaPw1RequestHandler(ctx: ActionCtx, request: Request): Promise<Response> {
  const op = "signInPw1HttpHandler"

  if (request.method !== "POST") {
    return apiError.response("auth.method-not-allowed", op, commonApiErrorMessages.methodNotAllowed)
  }

  const body = await request.text()
  if (!body) {
    const errorMessage = commonApiErrorMessages.emptyBody
    const errorResult = createError(op, errorMessage, body)
    console.warn(errorResult)
    return apiError.fromResultError("auth.bad-request", errorResult)
  }
  const schema = a.pipe(a.string(), a.parseJson(), signInViaPwSchema)
  const validation = a.safeParse(schema, body)
  if (!validation.success) {
    const errorMessage = commonApiErrorMessages.schemaValidationFailed + ": " + a.summarize(validation.issues)
    const errorResult = createError(op, errorMessage, body)
    console.warn(errorResult)
    return apiError.fromResultError("auth.bad-request", errorResult)
  }

  const { email, pw } = validation.output

  // Find user by email
  const user = await ctx.runQuery(internal.auth.findUserByEmailInternalQuery, {
    email,
  })
  if (!user) {
    const errorMessage = "User not found"
    const errorResult = createError(op, errorMessage, email)
    console.warn(errorResult)
    return apiError.fromResultError("auth.not-found", errorResult)
  }

  if (user.deletedAt) {
    const errorMessage = "User account has been deleted"
    const errorResult = createError(op, errorMessage, email)
    console.warn(errorResult)
    return apiError.fromResultError("auth.forbidden", errorResult)
  }

  // Verify password
  if (!user.hashedPassword) {
    const errorMessage = "Password not set"
    const errorResult = createError(op, errorMessage, email)
    console.warn(errorResult)
    return apiError.fromResultError("auth.bad-request", errorResult)
  }

  const pwVerifyResult = await verifyHashedPassword2(pw, user.hashedPassword)
  if (!pwVerifyResult.success) {
    const errorMessage = "Invalid password"
    const errorResult = createError(op, errorMessage)
    console.warn(errorResult)
    return apiError.fromResultError("auth.unauthorized", errorResult)
  }

  // Check for org membership
  const { orgHandle, orgRole } = await ctx.runQuery(internal.org.getOrgMemberHandleAndRoleInternalQuery, {
    userId: user._id as IdUser,
  })

  // Create token
  const tokenResult = await tokenCreateResult(user._id, orgHandle, orgRole)
  if (!tokenResult.success) {
    const errorResult = tokenResult
    console.warn(errorResult)
    return apiError.fromResultError("auth.internal", errorResult)
  }
  const token = tokenResult.data

  // Insert session
  const expiresAt = await ctx.runMutation(internal.auth.authSessionInsertInternalMutation, {
    userId: user._id as IdUser,
    loginMethod: loginMethod.password,
    token,
  })

  // Create user profile
  const userProfile = docUserToUserProfile(user, orgHandle, orgRole)

  // Create user session
  const userSession: UserSession = {
    token,
    profile: userProfile,
    hasPw: !!user.hashedPassword,
    signedInMethod: loginMethod.password,
    signedInAt: nowIso(),
    expiresAt,
  }

  return new Response(JSON.stringify(userSession), { status: 200 })
}
