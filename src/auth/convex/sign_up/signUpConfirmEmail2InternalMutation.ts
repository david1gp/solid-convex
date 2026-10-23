import { v } from "convex/values"
import * as a from "valibot"
import { internalMutation, type MutationCtx } from "#convex/_generated/server.js"
import { createError, createResult, type PromiseResult } from "#result"
import { saveTokenIntoSessionReturnExpiresAtFn } from "#src/auth/convex/crud/saveTokenIntoSessionReturnExpiresAtMutation.ts"
import { docUserToUserProfile } from "#src/auth/convex/user/docUserToUserProfile.ts"
import type { UserSession } from "#src/auth/model/UserSession.ts"
import { loginMethod } from "#src/auth/model_field/loginMethod.ts"
import { userRole } from "#src/auth/model_field/userRole.ts"
import { tokenCreateResult } from "#src/auth/server/jwt_token/tokenCreateResult.ts"
import { orgMemberGetHandleAndRoleFn } from "#src/org/member_convex/orgMemberGetHandleAndRoleInternalQuery.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { emailSchema } from "#src/utils/valibot/emailSchema.ts"
import { nowIso } from "#utils/date/nowIso.js"

const signUpConfirmEmailFields = {
  email: emailSchema,
  code: a.string(),
} as const

const signUpConfirmEmailConvexFields = valibotToConvex(signUpConfirmEmailFields)

export type SignUpConfirmValidatorType = typeof signUpConfirmEmailValidator.type
export const signUpConfirmEmailValidator = v.object(signUpConfirmEmailConvexFields)

export const signUpConfirmEmail2InternalMutation = internalMutation({
  args: signUpConfirmEmailValidator,
  handler: signUpConfirmEmail2InternalMutationFn,
})

export async function signUpConfirmEmail2InternalMutationFn(
  ctx: MutationCtx,
  args: SignUpConfirmValidatorType,
): PromiseResult<UserSession> {
  const op = "signUpConfirm2MutationFn"
  const { email, code } = args

  //
  // 1. Find the registration
  //
  const registration = await ctx.db
    .query("authUserEmailRegistrations")
    .withIndex("emailCode", (q) => q.eq("email", email).eq("code", code))
    .first()

  if (!registration) {
    return createError(op, "Invalid or expired code", code)
  }

  if (registration.consumedAt) {
    return createError(op, "Code already used", code)
  }

  const { name, hashedPassword } = registration
  // if (!hashedPassword) {
  //   return createError(op, "Missing password", code)
  // }

  //
  // 2. Create user
  //
  const now = nowIso()
  const userId = await ctx.db.insert("users", {
    name,
    email,
    emailVerifiedAt: now,
    hashedPassword,
    role: userRole.user,
    createdAt: now,
    updatedAt: now,
    deletedAt: undefined,
  })

  //
  // 3. Check for org membership
  //
  const { orgHandle, orgRole } = await orgMemberGetHandleAndRoleFn(ctx, userId)

  //
  // 4. Create session
  //
  const tokenResult = await tokenCreateResult(userId, orgHandle, orgRole)
  if (!tokenResult.success) {
    return tokenResult
  }
  const token = tokenResult.data
  const expiresAt = await saveTokenIntoSessionReturnExpiresAtFn(ctx, loginMethod.email, userId, token)

  //
  // 5. Mark code as consumed
  //
  await ctx.db.patch("authUserEmailRegistrations", registration._id, {
    consumedAt: nowIso(),
  })

  //
  // 6. Create user profile
  //
  const createdUser = await ctx.db.get("users", userId)
  if (!createdUser) {
    return createError(op, "Error finding created user", userId)
  }
  const userProfile = docUserToUserProfile(createdUser, orgHandle, orgRole)

  //
  // 7. Create and return user session
  //
  const userSession: UserSession = {
    token,
    profile: userProfile,
    hasPw: !!hashedPassword,
    signedInMethod: loginMethod.email,
    signedInAt: nowIso(),
    expiresAt,
  }

  return createResult(userSession)
}
