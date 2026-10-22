import type { MutationCtx } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import { createUserFromAuthProviderFn } from "#src/auth/convex/crud/createUserFromAuthProviderMutation.ts"
import { findUserByAuthAccountFn } from "#src/auth/convex/crud/findUserByAuthAccountFn.ts"
import { userEmailFindFn } from "#src/auth/convex/crud/findUserByEmailQuery.ts"
import { linkAuthToExistingUserFn } from "#src/auth/convex/crud/linkAuthToExistingUserFn.ts"
import { updateUserFromAuthProviderFn } from "#src/auth/convex/crud/updateUserFromAuthProviderFn.ts"
import { userRoleSyncFromAuthProviderFn } from "#src/auth/convex/crud/userRoleSyncFromAuthProviderFn.ts"
import type { DocAuthAccount } from "#src/auth/convex/IdUser.ts"
import { docUserToUserProfile } from "#src/auth/convex/user/docUserToUserProfile.ts"
import { createUserSessionTimes, type UserSession } from "#src/auth/model/UserSession.ts"
import { loginProvider } from "#src/auth/model_field/socialLoginProvider.ts"
import type { CommonAuthProvider } from "#src/auth/server/social_identity_providers/CommonAuthProvider.ts"
import { orgMemberGetHandleAndRoleFn } from "#src/org/member_convex/orgMemberGetHandleAndRoleInternalQuery.ts"

export type SignInUsingSocialAuthResultInternal = Omit<UserSession, "token">

export async function findOrCreateUserFn(
  ctx: MutationCtx,
  authData: CommonAuthProvider,
): PromiseResult<SignInUsingSocialAuthResultInternal> {
  const op = "findOrCreateUser"

  // Check for existing auth account
  const existingAuthAccount: DocAuthAccount | null = await findUserByAuthAccountFn(ctx, {
    provider: authData.provider,
    ...(authData.provider === loginProvider.oidc && { issuer: authData.issuer }),
    providerId: authData.providerId,
  })
  if (existingAuthAccount) {
    const user = await ctx.db.get("users", existingAuthAccount.userId)
    if (!user) return createResultError(op, "User not found by userId", existingAuthAccount.userId)
    if (user.deletedAt) return createResultError(op, "User account has been deleted")
    const profileUpdateResult = await updateUserFromAuthProviderFn(ctx, user._id, authData)
    if (!profileUpdateResult.success) return profileUpdateResult
    const syncedUserResult = await userRoleSyncFromAuthProviderFn(ctx, user._id, authData)
    if (!syncedUserResult.success) return syncedUserResult
    const syncedUser = syncedUserResult.data
    const { orgHandle, orgRole } = await orgMemberGetHandleAndRoleFn(ctx, syncedUser._id)
    const userProfile = docUserToUserProfile(syncedUser, orgHandle, orgRole)
    return createResult({
      profile: userProfile,
      hasPw: !!syncedUser.hashedPassword,
      signedInMethod: authData.provider,
      ...createUserSessionTimes(),
    })
  }

  // Check for existing user by email
  if (authData.provider !== loginProvider.oidc && authData.email) {
    const existingUser = await userEmailFindFn(ctx, authData.email)
    if (existingUser) {
      if (existingUser.deletedAt) return createResultError(op, "User account has been deleted")
      await linkAuthToExistingUserFn(ctx, existingUser._id, authData.provider, authData.providerId)
      const profileUpdateResult = await updateUserFromAuthProviderFn(ctx, existingUser._id, authData)
      if (!profileUpdateResult.success) return profileUpdateResult
      const updatedUser = await ctx.db.get("users", existingUser._id)
      if (!updatedUser) return createResultError(op, "User not found by userId", existingUser._id)
      const { orgHandle, orgRole } = await orgMemberGetHandleAndRoleFn(ctx, existingUser._id)
      const userProfile = docUserToUserProfile(updatedUser, orgHandle, orgRole)
      return createResult({
        profile: userProfile,
        hasPw: !!existingUser.hashedPassword,
        signedInMethod: authData.provider,
        ...createUserSessionTimes(),
      })
    }
  }

  // No existing user found - create new one
  const createdResult = await createUserFromAuthProviderFn(ctx, authData)
  if (!createdResult.success) {
    return createResultError(op, `Failed to create user: ${createdResult.errorMessage}`)
  }
  const userSession: SignInUsingSocialAuthResultInternal = {
    profile: createdResult.data,
    hasPw: false,
    signedInMethod: authData.provider,
    ...createUserSessionTimes(),
  }
  return createResult(userSession)
}
