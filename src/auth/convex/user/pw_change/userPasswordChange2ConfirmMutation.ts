import * as a from "valibot"
import { internalMutation, type MutationCtx, mutation } from "#convex/_generated/server.js"
import { createError, type PromiseResult } from "#result"
import { saveTokenIntoSessionReturnExpiresAtFn } from "#src/auth/convex/crud/saveTokenIntoSessionReturnExpiresAtMutation.ts"
import type { DocUser, IdUser } from "#src/auth/convex/IdUser.ts"
import { otpConsumeFn } from "#src/auth/convex/otp/otpConsumeFn.ts"
import { otpFindFn } from "#src/auth/convex/otp/otpFindFn.ts"
import { hashPassword2 } from "#src/auth/convex/pw/hashPassword.ts"
import { docUserToUserProfile } from "#src/auth/convex/user/docUserToUserProfile.ts"
import type { UserSession } from "#src/auth/model/UserSession.ts"
import { loginMethod } from "#src/auth/model_field/loginMethod.ts"
import { otpPurpose } from "#src/auth/model_field/otpPurpose.ts"
import { passwordSchema } from "#src/auth/model_field/passwordSchema.ts"
import { createTokenResult } from "#src/auth/server/jwt_token/createTokenResult.ts"
import { orgMemberGetHandleAndRoleFn } from "#src/org/member_convex/orgMemberGetHandleAndRoleInternalQuery.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authMutationTokenToUserId } from "#src/utils/convex_backend/authMutationTokenToUserId.ts"
import { createErrorAndLogError } from "#src/utils/convex_backend/createErrorAndLogError.ts"
import { createErrorAndLogWarn } from "#src/utils/convex_backend/createErrorAndLogWarn.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"
import { createUserIdValidator } from "#src/utils/convex_backend/createUserIdValidator.ts"
import { nowIso } from "#utils/date/nowIso.js"

const userPasswordChange2ConfirmFieldsBase = valibotToConvex({
  newPassword: passwordSchema,
  confirmationCode: a.string(),
})

export const userPasswordChange2ConfirmValidatorInternal = createUserIdValidator(userPasswordChange2ConfirmFieldsBase)
export type UserPasswordChangeConfirmTypeInternal = typeof userPasswordChange2ConfirmValidatorInternal.type

export const userPasswordChange2ConfirmValidatorPublic = createTokenValidator(userPasswordChange2ConfirmFieldsBase)
export type UserPasswordChangeConfirmTypePublic = typeof userPasswordChange2ConfirmValidatorPublic.type

export const userPasswordChange2ConfirmMutation = mutation({
  args: userPasswordChange2ConfirmValidatorPublic,
  handler: async (ctx, args) => authMutationTokenToUserId(ctx, args, userPasswordChange2ConfirmFn),
})

export const userPasswordChange2ConfirmInternalMutation = internalMutation({
  args: userPasswordChange2ConfirmValidatorInternal,
  handler: async (ctx, args) => userPasswordChange2ConfirmFn(ctx, args),
})

async function userPasswordChange2ConfirmFn(
  ctx: MutationCtx,
  args: UserPasswordChangeConfirmTypeInternal,
): PromiseResult<UserSession> {
  const op = "userPasswordChange2ConfirmFn"

  const newPasswordValidation = a.safeParse(passwordSchema, args.newPassword)
  if (!newPasswordValidation.success) {
    return createErrorAndLogWarn(op, newPasswordValidation.issues[0].message)
  }

  const userId = args.userId as IdUser
  const user: DocUser | null = await ctx.db.get("users", userId)
  if (!user) {
    return createErrorAndLogError(op, "User not found")
  }

  if (!user.email) {
    return createErrorAndLogError(op, "User email not found")
  }

  const otpFindResult = await otpFindFn(ctx, {
    email: user.email,
    code: args.confirmationCode,
    purpose: otpPurpose.passwordChange,
  })
  if (!otpFindResult.success) {
    return createErrorAndLogWarn(op, otpFindResult.errorMessage)
  }
  const otpRecord = otpFindResult.data

  await otpConsumeFn(ctx, { otpId: otpRecord._id })

  const newPasswordHash = await hashPassword2(args.newPassword)
  if (!newPasswordHash.success) {
    return createErrorAndLogError(op, newPasswordHash.errorMessage || "Password hashing failed")
  }

  await ctx.db.patch("users", userId, {
    hashedPassword: newPasswordHash.data,
    updatedAt: nowIso(),
  })

  const { orgHandle, orgRole } = await orgMemberGetHandleAndRoleFn(ctx, userId)
  const userProfile = docUserToUserProfile(user as DocUser, orgHandle, orgRole)
  const tokenResult = await createTokenResult(userId, orgHandle, orgRole)
  if (!tokenResult.success) return createError(op, tokenResult.errorMessage)
  const token = tokenResult.data
  const expiresAt = await saveTokenIntoSessionReturnExpiresAtFn(ctx, loginMethod.email, userId, token)
  const userSession: UserSession = {
    token,
    profile: userProfile,
    hasPw: !!user.hashedPassword,
    signedInMethod: loginMethod.email,
    signedInAt: nowIso(),
    expiresAt,
  }

  return { success: true, data: userSession }
}
