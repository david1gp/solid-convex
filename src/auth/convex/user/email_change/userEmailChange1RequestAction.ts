import { v } from "convex/values"
import * as a from "valibot"
import { internal } from "#convex/_generated/api.js"
import { type ActionCtx, action, internalAction } from "#convex/_generated/server.js"
import type { PromiseResult } from "#result"
import { envBaseUrlAppResult } from "#src/app/env/public/envBaseUrlAppResult.ts"
import { languageSchema } from "#src/app/i18n/language.ts"
import { sendEmailChangeEmail } from "#src/auth/convex/email/sendEmailChangeEmail.ts"
import type { DocUser } from "#src/auth/convex/IdUser.ts"
import { verifyHashedPassword2 } from "#src/auth/convex/pw/verifyHashedPassword.ts"
import { vIdUser } from "#src/auth/convex/vIdUser.ts"
import { otpPurpose } from "#src/auth/model_field/otpPurpose.ts"
import { pageRouteAuth } from "#src/auth/url/pageRouteAuth.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authActionTokenToUserId } from "#src/utils/convex_backend/authActionTokenToUserId.ts"
import { createErrorAndLogError } from "#src/utils/convex_backend/createErrorAndLogError.ts"
import { createErrorAndLogWarn } from "#src/utils/convex_backend/createErrorAndLogWarn.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"
import { emailSchema } from "#src/utils/valibot/emailSchema.ts"

const userEmailChangeSchemaFields = {
  newEmail: a.string(),
  currentPassword: a.optional(a.string()),
  l: languageSchema,
} as const

export const userEmailChangeFieldsBase = valibotToConvex(userEmailChangeSchemaFields)

export const userEmailChangeValidatorPublic = createTokenValidator(userEmailChangeFieldsBase)
export type UserEmailChangeTypePublic = typeof userEmailChangeValidatorPublic.type

export const userEmailChangeValidatorInternal = v.object({
  ...userEmailChangeFieldsBase,
  userId: vIdUser,
})

export type UserEmailChangeTypeInternal = typeof userEmailChangeValidatorInternal.type

export const userEmailChange1RequestAction = action({
  args: userEmailChangeValidatorPublic,
  handler: async (ctx, args) => authActionTokenToUserId(ctx, args, userEmailChange1RequestActionFn),
})

export const userEmailChange1RequestInternalAction = internalAction({
  args: userEmailChangeValidatorInternal,
  handler: userEmailChange1RequestActionFn,
})

async function userEmailChange1RequestActionFn(ctx: ActionCtx, args: UserEmailChangeTypeInternal): PromiseResult<null> {
  const op = "userEmailChangeFn"

  const emailValidation = a.safeParse(emailSchema, args.newEmail)
  if (!emailValidation.success) {
    return createErrorAndLogWarn(op, emailValidation.issues[0].message, args.newEmail)
  }

  const user: DocUser | null = await ctx.runQuery(internal.auth.userGetInternalQuery, {
    userId: args.userId,
  })
  if (!user) {
    return createErrorAndLogError(op, "User not found")
  }

  if (user.hashedPassword) {
    if (!args.currentPassword) {
      return createErrorAndLogWarn(op, "Current password is required for users with password")
    }
    const passwordVerify = await verifyHashedPassword2(args.currentPassword, user.hashedPassword)
    if (!passwordVerify.success) {
      return createErrorAndLogWarn(op, passwordVerify.errorMessage || "Password verification failed")
    }
    if (!passwordVerify.data) {
      return createErrorAndLogWarn(op, "Current password is incorrect")
    }
  }

  const existingUser = await ctx.runQuery(internal.auth.findUserByEmailInternalQuery, { email: args.newEmail })
  if (existingUser) {
    return createErrorAndLogWarn(op, "Email already in use")
  }

  const otpResult = await ctx.runMutation(internal.auth.otpSaveInternalMutation, {
    userId: args.userId,
    email: args.newEmail,
    purpose: otpPurpose.emailChange,
  })
  if (!otpResult.success) return otpResult
  const otp = otpResult.data

  const baseUrlResult = envBaseUrlAppResult()
  if (!baseUrlResult.success) {
    return baseUrlResult
  }
  const baseUrl = baseUrlResult.data

  const confirmUrl = new URL(pageRouteAuth.userProfileMeChangeEmail, baseUrl)
  confirmUrl.searchParams.set("email", args.newEmail)
  confirmUrl.searchParams.set("code", otp)
  confirmUrl.searchParams.set("step", "2")
  const url = confirmUrl.toString()

  const sendResult = await sendEmailChangeEmail(user.name, args.newEmail, otp, url, args.l)
  if (!sendResult.success) {
    return sendResult
  }

  return { success: true, data: null }
}
