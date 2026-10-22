import { internalMutation, type MutationCtx } from "#convex/_generated/server.js"
import { createResult, type PromiseResult } from "#result"
import { findOrCreateUserFn } from "#src/auth/convex/crud/findOrCreateUserFn.ts"
import { saveTokenIntoSessionReturnExpiresAtFn } from "#src/auth/convex/crud/saveTokenIntoSessionReturnExpiresAtMutation.ts"
import type { IdUser } from "#src/auth/convex/IdUser.ts"
import type { UserSession } from "#src/auth/model/UserSession.ts"
import { tokenCreateResult } from "#src/auth/server/jwt_token/tokenCreateResult.ts"
import {
  type CommonAuthProvider,
  commonAuthProviderValidator,
} from "#src/auth/server/social_identity_providers/CommonAuthProvider.ts"
import { orgMemberGetHandleAndRoleFn } from "#src/org/member_convex/orgMemberGetHandleAndRoleInternalQuery.ts"

export const signInUsingSocialAuth3InternalMutation = internalMutation({
  args: commonAuthProviderValidator,
  handler: signInUsingSocialAuth3MutationFn,
})

export async function signInUsingSocialAuth3MutationFn(
  ctx: MutationCtx,
  providerInfo: CommonAuthProvider,
): PromiseResult<UserSession> {
  const op = "signInUsingSocialAuthMutationFn"
  // Find or create user
  const foundOrCreatedResult = await findOrCreateUserFn(ctx, providerInfo)
  if (!foundOrCreatedResult.success) {
    console.log("failed to find user", foundOrCreatedResult.errorMessage)
    return foundOrCreatedResult
  }
  const userWithoutToken = foundOrCreatedResult.data
  const userId = userWithoutToken.profile.userId as IdUser

  // Check for org membership
  const { orgHandle, orgRole } = await orgMemberGetHandleAndRoleFn(ctx, userId)

  // data
  const tokenResult = await tokenCreateResult(userId, orgHandle, orgRole)
  if (!tokenResult.success) return tokenResult
  const token = tokenResult.data
  await saveTokenIntoSessionReturnExpiresAtFn(ctx, providerInfo.provider, userId as IdUser, token)
  // event
  const r: UserSession = {
    token,
    profile: {
      ...userWithoutToken.profile,
      orgHandle,
      orgRole,
    },
    hasPw: userWithoutToken.hasPw,
    signedInMethod: userWithoutToken.signedInMethod,
    signedInAt: userWithoutToken.signedInAt,
    expiresAt: userWithoutToken.expiresAt,
  }
  return createResult(r)
}
