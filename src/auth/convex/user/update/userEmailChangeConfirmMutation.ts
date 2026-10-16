import { v } from "convex/values"
import * as a from "valibot"
import { internalMutation, type MutationCtx, mutation } from "#convex/_generated/server.js"
import type { PromiseResult } from "#result"
import type { DocUser, IdUser } from "#src/auth/convex/IdUser.ts"
import { otpConsumeFn } from "#src/auth/convex/otp/otpConsumeFn.ts"
import { otpFindFn } from "#src/auth/convex/otp/otpFindFn.ts"
import { vIdUser } from "#src/auth/convex/vIdUser.ts"
import { otpPurpose } from "#src/auth/model_field/otpPurpose.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authMutationTokenToUserId } from "#src/utils/convex_backend/authMutationTokenToUserId.ts"
import { createErrorAndLogError } from "#src/utils/convex_backend/createErrorAndLogError.ts"
import { createErrorAndLogWarn } from "#src/utils/convex_backend/createErrorAndLogWarn.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"
import { nowIso } from "#utils/date/nowIso.js"

const userEmailChangeConfirmFieldsBase = valibotToConvex({
  newEmail: a.string(),
  confirmationCode: a.string(),
})

export const userEmailChangeConfirmValidatorInternal = v.object({
  ...userEmailChangeConfirmFieldsBase,
  userId: vIdUser,
})
export type UserEmailChangeConfirmTypeInternal = typeof userEmailChangeConfirmValidatorInternal.type

export const userEmailChangeConfirmValidatorPublic = createTokenValidator(userEmailChangeConfirmFieldsBase)
export type UserEmailChangeConfirmTypePublic = typeof userEmailChangeConfirmValidatorPublic.type

export const userEmailChangeConfirmMutation = mutation({
  args: userEmailChangeConfirmValidatorPublic,
  handler: async (ctx, args) => authMutationTokenToUserId(ctx, args, userEmailChangeConfirmFn),
})

export const userEmailChangeConfirmInternalMutation = internalMutation({
  args: userEmailChangeConfirmValidatorInternal,
  handler: async (ctx, args) => userEmailChangeConfirmFn(ctx, args),
})

async function userEmailChangeConfirmFn(
  ctx: MutationCtx,
  args: UserEmailChangeConfirmTypeInternal,
): PromiseResult<string> {
  const op = "userEmailChangeConfirmFn"

  const userId = args.userId as IdUser
  const user: DocUser | null = await ctx.db.get("users", userId)
  if (!user) {
    return createErrorAndLogError(op, "User not found")
  }

  const otpFindResult = await otpFindFn(ctx, {
    email: args.newEmail,
    code: args.confirmationCode,
    purpose: otpPurpose.emailChange,
  })
  if (!otpFindResult.success) {
    return createErrorAndLogWarn(op, otpFindResult.errorMessage || "Invalid or expired verification code")
  }
  const otpRecord = otpFindResult.data

  await otpConsumeFn(ctx, { otpId: otpRecord._id })

  await ctx.db.patch("users", userId, {
    email: args.newEmail,
    emailVerifiedAt: nowIso(),
    updatedAt: nowIso(),
  })

  return { success: true, data: userId }
}
