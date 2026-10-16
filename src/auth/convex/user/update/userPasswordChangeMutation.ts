import { v } from "convex/values"
import * as a from "valibot"
import { internalMutation, type MutationCtx, mutation } from "#convex/_generated/server.js"
import type { PromiseResult } from "#result"
import type { DocUser, IdUser } from "#src/auth/convex/IdUser.ts"
import { hashPassword2 } from "#src/auth/convex/pw/hashPassword.ts"
import { verifyHashedPassword2 } from "#src/auth/convex/pw/verifyHashedPassword.ts"
import { vIdUser } from "#src/auth/convex/vIdUser.ts"
import { passwordSchema } from "#src/auth/model_field/passwordSchema.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authMutationTokenToUserId } from "#src/utils/convex_backend/authMutationTokenToUserId.ts"
import { createErrorAndLogError } from "#src/utils/convex_backend/createErrorAndLogError.ts"
import { createErrorAndLogWarn } from "#src/utils/convex_backend/createErrorAndLogWarn.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"

const userPasswordChangeSchemaFields = {
  currentPassword: a.optional(a.string()),
  newPassword: a.string(),
} as const

const userPasswordChangeFieldsBase = valibotToConvex(userPasswordChangeSchemaFields)

export const userPasswordChangeValidatorInternal = v.object({
  ...userPasswordChangeFieldsBase,
  userId: vIdUser,
})
export type UserPasswordChangeTypeInternal = typeof userPasswordChangeValidatorInternal.type

export const userPasswordChangeValidatorPublic = createTokenValidator(userPasswordChangeFieldsBase)
export type UserPasswordChangeTypePublic = typeof userPasswordChangeValidatorPublic.type

export const userPasswordChangeMutation = mutation({
  args: userPasswordChangeValidatorPublic,
  handler: async (ctx, args) => authMutationTokenToUserId(ctx, args, userPasswordChangeFn),
})

export const userPasswordChangeInternalMutation = internalMutation({
  args: userPasswordChangeValidatorInternal,
  handler: async (ctx, args) => userPasswordChangeFn(ctx, args),
})

async function userPasswordChangeFn(ctx: MutationCtx, args: UserPasswordChangeTypeInternal): PromiseResult<string> {
  const op = "userPasswordChangeFn"

  const newPasswordValidation = a.safeParse(passwordSchema, args.newPassword)
  if (!newPasswordValidation.success) {
    return createErrorAndLogWarn(op, newPasswordValidation.issues[0].message)
  }

  const userId = args.userId as IdUser
  const user: DocUser | null = await ctx.db.get("users", userId)
  if (!user) {
    return createErrorAndLogError(op, "User not found")
  }

  if (user.hashedPassword) {
    if (!args.currentPassword) {
      return createErrorAndLogWarn(op, "Current password is required when changing an existing password")
    }

    const currentPasswordVerify = await verifyHashedPassword2(args.currentPassword, user.hashedPassword)
    if (!currentPasswordVerify.success) {
      return createErrorAndLogWarn(op, currentPasswordVerify.errorMessage || "Password verification failed")
    }
    if (!currentPasswordVerify.data) {
      return createErrorAndLogWarn(op, "Current password is incorrect")
    }
  }

  const newPasswordHash = await hashPassword2(args.newPassword)
  if (!newPasswordHash.success) {
    return createErrorAndLogError(op, newPasswordHash.errorMessage || "Password hashing failed")
  }

  await ctx.db.patch("users", userId, {
    hashedPassword: newPasswordHash.data,
    updatedAt: new Date().toISOString(),
  })

  return { success: true, data: userId }
}
