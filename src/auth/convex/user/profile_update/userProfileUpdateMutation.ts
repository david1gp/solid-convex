import { type MutationCtx, mutation } from "#convex/_generated/server.js"
import { createResult, type PromiseResult } from "#result"
import { saveTokenIntoSessionReturnExpiresAtFn } from "#src/auth/convex/crud/saveTokenIntoSessionReturnExpiresAtMutation.ts"
import type { IdUser } from "#src/auth/convex/IdUser.ts"
import {
  type UserProfileFieldsTypeInternal,
  userProfileUpdateInternalFn,
} from "#src/auth/convex/user/profile_update/userProfileUpdateMutationInternal.ts"
import type { UserProfile } from "#src/auth/model/UserProfile.ts"
import type { UserSession } from "#src/auth/model/UserSession.ts"
import { type LoginMethod, loginMethod } from "#src/auth/model_field/loginMethod.ts"
import { tokenCreateResult } from "#src/auth/server/jwt_token/tokenCreateResult.ts"
import type { OrgRole } from "#src/org/org_model_field/orgRole.ts"
import { authMutationTokenToUserId } from "#src/utils/convex_backend/authMutationTokenToUserId.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"
import { nowIso } from "#utils/date/nowIso.js"
import { userProfileUpdateFields } from "./userProfileUpdate.js"

export const userProfileFieldsValidatorPublic = createTokenValidator(userProfileUpdateFields)
export type UserProfileFieldsTypePublic = typeof userProfileFieldsValidatorPublic.type

export const userProfileUpdateMutation = mutation({
  args: userProfileFieldsValidatorPublic,
  handler: async (ctx, args) => authMutationTokenToUserId(ctx, args, userProfileUpdatePublicFn),
})

async function userProfileUpdatePublicFn(
  ctx: MutationCtx,
  args: Omit<UserProfileFieldsTypeInternal, "token"> & { userId: IdUser },
): PromiseResult<UserSession | null> {
  const op = "userProfileUpdatePublicFn"
  console.log(op, args)

  const userProfileResult = await userProfileUpdateInternalFn(ctx, args)
  if (!userProfileResult.success) {
    return userProfileResult
  }
  if (!userProfileResult.data) {
    return createResult(null)
  }
  return createUserSessionResult(
    ctx,
    args.userId,
    userProfileResult.data,
    loginMethod.email,
    userProfileResult.data.orgHandle,
    userProfileResult.data.orgRole,
  )
}

async function createUserSessionResult(
  ctx: MutationCtx,
  userId: IdUser,
  userProfile: UserProfile,
  signedInMethod: LoginMethod,
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
