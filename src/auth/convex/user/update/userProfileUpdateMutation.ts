import { type MutationCtx, mutation } from "#convex/_generated/server.js"
import { createResult, type PromiseResult } from "#result"
import { saveTokenIntoSessionReturnExpiresAtFn } from "#src/auth/convex/crud/saveTokenIntoSessionReturnExpiresAtMutation.ts"
import type { DocUser, IdUser } from "#src/auth/convex/IdUser.ts"
import { docUserToUserProfile } from "#src/auth/convex/user/docUserToUserProfile.ts"
import {
  type UserProfileFieldsTypeInternal,
  userProfileFieldsBase,
} from "#src/auth/convex/user/update/userProfileUpdateMutationInternal.ts"
import type { UserProfile } from "#src/auth/model/UserProfile.ts"
import type { UserSession } from "#src/auth/model/UserSession.ts"
import { loginMethod } from "#src/auth/model_field/loginMethod.ts"
import { tokenCreateResult } from "#src/auth/server/jwt_token/tokenCreateResult.ts"
import { orgMemberGetHandleAndRoleFn } from "#src/org/member_convex/orgMemberGetHandleAndRoleInternalQuery.ts"
import type { OrgRole } from "#src/org/org_model_field/orgRole.ts"
import { authMutationTokenToUserId } from "#src/utils/convex_backend/authMutationTokenToUserId.ts"
import { createErrorAndLogError } from "#src/utils/convex_backend/createErrorAndLogError.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"
import { nowIso } from "#utils/date/nowIso.js"

export const userProfileFieldsValidatorPublic = createTokenValidator(userProfileFieldsBase)
export type UserProfileFieldsTypePublic = typeof userProfileFieldsValidatorPublic.type

export const userProfileUpdateMutation = mutation({
  args: userProfileFieldsValidatorPublic,
  handler: async (ctx, args) => authMutationTokenToUserId(ctx, args, userProfileUpdatePublicFn),
})

async function userProfileUpdatePublicFn(
  ctx: MutationCtx,
  args: UserProfileFieldsTypeInternal,
): PromiseResult<UserSession | null> {
  const op = "userProfileUpdatePublicFn"
  const userId = args.userId

  const currentUser: DocUser | null = await ctx.db.get("users", userId)
  if (!currentUser) {
    return createErrorAndLogError(op, "User not found", userId)
  }

  const nameChanged = args.name !== currentUser.name
  const imageChanged = args.image !== currentUser.image

  if (!nameChanged && !imageChanged) {
    return createResult(null)
  }

  await ctx.db.patch("users", userId, {
    ...(nameChanged && { name: args.name }),
    ...(imageChanged && { image: args.image }),
    updatedAt: nowIso(),
  })

  const updatedUser = await ctx.db.get("users", userId)
  if (!updatedUser) {
    return createErrorAndLogError(op, "User not found after update")
  }

  const { orgHandle, orgRole } = await orgMemberGetHandleAndRoleFn(ctx, userId)
  const userProfile = docUserToUserProfile(updatedUser, orgHandle, orgRole)
  return createUserSessionResult(ctx, userId, userProfile, loginMethod.email, orgHandle, orgRole)
}

async function createUserSessionResult(
  ctx: MutationCtx,
  userId: IdUser,
  userProfile: UserProfile,
  signedInMethod: typeof loginMethod.email,
  orgHandle?: string,
  orgRole?: OrgRole,
): PromiseResult<UserSession> {
  const op = "createUserSessionResult"

  const tokenResult = await tokenCreateResult(userId, orgHandle, orgRole)
  if (!tokenResult.success) {
    return tokenResult
  }
  const token = tokenResult.data

  const expiresAt = await saveTokenIntoSessionReturnExpiresAtFn(ctx, signedInMethod, userId, token, nowIso())

  const userSession: UserSession = {
    token,
    profile: userProfile,
    hasPw: !!userProfile.email,
    signedInMethod,
    signedInAt: nowIso(),
    expiresAt,
  }

  return createResult(userSession)
}
