import { internalMutation, type MutationCtx } from "#convex/_generated/server.js"
import { createResult, type PromiseResult } from "#result"
import type { DocUser, IdUser } from "#src/auth/convex/IdUser.ts"
import { docUserToUserProfile } from "#src/auth/convex/user/docUserToUserProfile.ts"
import { userProfileUpdateFields } from "#src/auth/convex/user/profile_update/userProfileUpdate.ts"
import type { UserProfile } from "#src/auth/model/UserProfile.ts"
import { orgMemberGetHandleAndRoleFn } from "#src/org/member_convex/orgMemberGetHandleAndRoleInternalQuery.ts"
import { createErrorAndLogError } from "#src/utils/convex_backend/createErrorAndLogError.ts"
import { createUserIdValidator } from "#src/utils/convex_backend/createUserIdValidator.ts"
import { nowIso } from "#utils/date/nowIso.js"

export const userProfileFieldsBase = userProfileUpdateFields

export const userProfileFieldsValidatorInternal = createUserIdValidator(userProfileFieldsBase)
export type UserProfileFieldsTypeInternal = typeof userProfileFieldsValidatorInternal.type

export const userProfileUpdateInternalMutation = internalMutation({
  args: userProfileFieldsValidatorInternal,
  handler: async (ctx, args) => userProfileUpdateInternalFn(ctx, args),
})

async function userProfileUpdateInternalFn(
  ctx: MutationCtx,
  args: UserProfileFieldsTypeInternal,
): PromiseResult<UserProfile> {
  const op = "userProfileUpdateInternalFn"

  const userId = args.userId as IdUser
  const currentUser: DocUser | null = await ctx.db.get("users", userId)
  if (!currentUser) {
    return createErrorAndLogError(op, "User not found")
  }

  const nameChanged = args.name !== undefined && args.name !== currentUser.name
  const imageChanged = args.image !== undefined && args.image !== currentUser.image
  const bioChanged = args.bio !== undefined && args.bio !== currentUser.bio
  const urlChanged = args.url !== undefined && args.url !== currentUser.url

  if (!nameChanged && !imageChanged && !bioChanged && !urlChanged) {
    const { orgHandle, orgRole } = await orgMemberGetHandleAndRoleFn(ctx, userId)
    return createResult(docUserToUserProfile(currentUser, orgHandle, orgRole))
  }

  await ctx.db.patch("users", userId, {
    ...(nameChanged && { name: args.name }),
    ...(imageChanged && { image: args.image }),
    ...(bioChanged && { bio: args.bio }),
    ...(urlChanged && { url: args.url }),
    updatedAt: nowIso(),
  })

  const updatedUser = await ctx.db.get("users", userId)
  if (!updatedUser) {
    return createErrorAndLogError(op, "User not found after update")
  }

  const { orgHandle, orgRole } = await orgMemberGetHandleAndRoleFn(ctx, userId)
  return createResult(docUserToUserProfile(updatedUser, orgHandle, orgRole))
}
