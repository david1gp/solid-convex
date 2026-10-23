import { internalMutation, type MutationCtx, mutation } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import { userEmailFindFn } from "#src/auth/convex/crud/findUserByEmailQuery.ts"
import { userDeleteHardOtps } from "#src/auth/convex/user/delete_hard/userDeleteHardOtps.ts"
import { userDeleteHardApiKeys } from "#src/auth/convex/user/delete_hard_parts/userDeleteHardApiKeys.ts"
import { userDeleteHardAuthAccounts } from "#src/auth/convex/user/delete_hard_parts/userDeleteHardAuthAccounts.ts"
import { userDeleteHardAuthSessions } from "#src/auth/convex/user/delete_hard_parts/userDeleteHardAuthSessions.ts"
import { userDeleteHardEmailLoginCodes } from "#src/auth/convex/user/delete_hard_parts/userDeleteHardEmailLoginCodes.ts"
import { userDeleteHardFiles } from "#src/auth/convex/user/delete_hard_parts/userDeleteHardFiles.ts"
import { userDeleteHardOrgMemberships } from "#src/auth/convex/user/delete_hard_parts/userDeleteHardOrgMemberships.ts"
import { authMutationTokenToUserId } from "#src/utils/convex_backend/authMutationTokenToUserId.ts"
import {
  type UserDeleteValidatorInternalType,
  userDeleteValidatorInternal,
  userDeleteValidatorPublic,
} from "./userDeleteValidator.js"

export const userDeleteHardMutation = mutation({
  args: userDeleteValidatorPublic,
  handler: async (ctx, args) => authMutationTokenToUserId(ctx, args, userDeleteHardMutationFn),
})

export const userDeleteHardInternalMutation = internalMutation({
  args: userDeleteValidatorInternal,
  handler: userDeleteHardMutationFn,
})

export async function userDeleteHardMutationFn(
  ctx: MutationCtx,
  args: UserDeleteValidatorInternalType,
): PromiseResult<null> {
  const op = "userDeleteHardMutationFn"

  // Find user by ID or email
  let userId = args.userId
  if (!userId && args.email) {
    const user = await userEmailFindFn(ctx, args.email)
    if (!user) return createResult(null) // idempotent - user not found
    userId = user._id
  }

  if (!userId) return createResultError(op, "Either userId or email must be provided")

  const user = await ctx.db.get("users", userId)
  if (!user) return createResultError(op, "User not found")

  // Clean up ALL dependent records in dependency order
  await userDeleteHardAuthSessions(ctx, userId)
  await userDeleteHardApiKeys(ctx, userId)
  await userDeleteHardOtps(ctx, userId)
  await userDeleteHardEmailLoginCodes(ctx, userId)
  await userDeleteHardAuthAccounts(ctx, userId)
  await userDeleteHardOrgMemberships(ctx, userId)
  await userDeleteHardFiles(ctx, userId)

  // Finally delete user record
  await ctx.db.delete("users", userId)

  return createResult(null)
}
