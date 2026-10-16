import { v } from "convex/values"
import * as a from "valibot"
import { internalMutation, type MutationCtx, mutation } from "#convex/_generated/server.js"
import type { PromiseResult } from "#result"
import type { DocUser, IdUser } from "#src/auth/convex/IdUser.ts"
import { otpSaveFn } from "#src/auth/convex/otp/otpSaveFn.ts"
import { verifyHashedPassword2 } from "#src/auth/convex/pw/verifyHashedPassword.ts"
import { vIdUser } from "#src/auth/convex/vIdUser.ts"
import { otpPurpose } from "#src/auth/model_field/otpPurpose.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authMutationTokenToUserId } from "#src/utils/convex_backend/authMutationTokenToUserId.ts"
import { createErrorAndLogError } from "#src/utils/convex_backend/createErrorAndLogError.ts"
import { createErrorAndLogWarn } from "#src/utils/convex_backend/createErrorAndLogWarn.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"
import { emailSchema } from "#src/utils/valibot/emailSchema.ts"

const userEmailChangeSchemaFields = {
  currentPassword: a.optional(a.string()),
  newEmail: a.string(),
} as const

export const userEmailChangeFieldsBase = valibotToConvex(userEmailChangeSchemaFields)

export const userEmailChangeValidatorInternal = v.object({
  ...userEmailChangeFieldsBase,
  userId: vIdUser,
})
export type UserEmailChangeTypeInternal = typeof userEmailChangeValidatorInternal.type

export const userEmailChangeValidatorPublic = createTokenValidator(userEmailChangeFieldsBase)
export type UserEmailChangeTypePublic = typeof userEmailChangeValidatorPublic.type

export const userEmailChangeMutation = mutation({
  args: userEmailChangeValidatorPublic,
  handler: async (ctx, args) => authMutationTokenToUserId(ctx, args, userEmailChangeFn),
})

export const userEmailChangeInternalMutation = internalMutation({
  args: userEmailChangeValidatorInternal,
  handler: async (ctx, args) => userEmailChangeFn(ctx, args),
})

async function userEmailChangeFn(ctx: MutationCtx, args: UserEmailChangeTypeInternal): PromiseResult<string> {
  const op = "userEmailChangeFn"

  const emailValidation = a.safeParse(emailSchema, args.newEmail)
  if (!emailValidation.success) {
    return createErrorAndLogWarn(op, emailValidation.issues[0].message, args.newEmail)
  }

  const userId = args.userId as IdUser
  const user: DocUser | null = await ctx.db.get("users", userId)
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

  const existingUser = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", args.newEmail))
    .unique()
  if (existingUser) {
    return createErrorAndLogWarn(op, "Email already in use")
  }

  const saveResult = await otpSaveFn(ctx, {
    userId,
    email: args.newEmail,
    purpose: otpPurpose.emailChange,
  })
  if (!saveResult.success) return saveResult

  return { success: true, data: saveResult.data }
}
