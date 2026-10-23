import { v } from "convex/values"
import { internalMutation, type MutationCtx } from "#convex/_generated/server.js"
import { createError, type PromiseResult } from "#result"
import { userEmailFindFn } from "#src/auth/convex/crud/findUserByEmailQuery.ts"
import type { IdUser } from "#src/auth/convex/IdUser.ts"
import { otpSaveFn } from "#src/auth/convex/otp/otpSaveFn.ts"
import { otpPurpose } from "#src/auth/model_field/otpPurpose.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { emailSchema } from "#src/utils/valibot/emailSchema.ts"

const signInViaEmailSaveCodeFields = {
  email: emailSchema,
} as const

const signInViaEmailSaveCodeConvexFields = valibotToConvex(signInViaEmailSaveCodeFields)

export type SignInViaEmailSaveCodeValidatorType = typeof signInViaEmailSaveCodeValidator.type
export const signInViaEmailSaveCodeValidator = v.object(signInViaEmailSaveCodeConvexFields)

export const signInViaEmail2InternalMutation = internalMutation({
  args: signInViaEmailSaveCodeValidator,
  handler: signInViaEmail2InternalMutationFn,
})

export async function signInViaEmail2InternalMutationFn(
  ctx: MutationCtx,
  args: SignInViaEmailSaveCodeValidatorType,
): PromiseResult<string> {
  const op = "signInEmailSaveCode2MutationFn"
  const { email } = args

  const user = await userEmailFindFn(ctx, email)
  if (!user) {
    return createError(op, "User not found")
  }

  const userId = user._id as IdUser

  return otpSaveFn(ctx, { userId, email, purpose: otpPurpose.signIn })
}
