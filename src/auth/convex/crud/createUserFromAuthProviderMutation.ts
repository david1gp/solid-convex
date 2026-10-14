import type { WithoutSystemFields } from "convex/server"
import { internalMutation, type MutationCtx } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import { findUserByAuthAccountFn } from "#src/auth/convex/crud/findUserByAuthAccountFn.ts"
import type { DocUser } from "#src/auth/convex/IdUser.ts"
import { docUserToUserProfile } from "#src/auth/convex/user/docUserToUserProfile.ts"
import type { UserProfile } from "#src/auth/model/UserProfile.ts"
import { loginProvider } from "#src/auth/model_field/socialLoginProvider.ts"
import { userRole } from "#src/auth/model_field/userRole.ts"
import { userRoleEffectiveGet } from "#src/auth/model_field/userRoleEffectiveGet.ts"
import {
  type CommonAuthProvider,
  commonAuthProviderValidator,
  getUserNameFromCommonAuthProvider,
} from "#src/auth/server/social_identity_providers/CommonAuthProvider.ts"

export type UserFields = WithoutSystemFields<DocUser>

export const createUserFromAuthProviderInternalMutation = internalMutation({
  args: commonAuthProviderValidator,
  handler: createUserFromAuthProviderFn,
})

export async function createUserFromAuthProviderFn(
  ctx: MutationCtx,
  authProvider: CommonAuthProvider,
): PromiseResult<UserProfile> {
  const op = "createUserFromAuthProviderFn"

  // Check if authAccount already exists
  const existingAuthAccount = await findUserByAuthAccountFn(ctx, {
    provider: authProvider.provider,
    ...(authProvider.provider === loginProvider.oidc && { issuer: authProvider.issuer }),
    providerId: authProvider.providerId,
  })
  if (existingAuthAccount) {
    return createResultError(op, "Auth account already exists")
  }

  const now = new Date()
  const iso = now.toISOString()

  // Create user
  const userName = getUserNameFromCommonAuthProvider(authProvider, "New User")
  const oidcRoles = authProvider.provider === loginProvider.oidc ? authProvider.roles : undefined
  const effectiveRole =
    authProvider.provider === loginProvider.oidc
      ? oidcRoles !== undefined
        ? userRoleEffectiveGet(oidcRoles)
        : (authProvider.role ?? userRole.user)
      : userRole.user
  const toCreate = {
    name: userName,
    image: authProvider.image,
    ...(authProvider.email && { email: authProvider.email }),
    role: effectiveRole,
    ...(oidcRoles !== undefined ? { roles: oidcRoles } : {}),
    createdAt: iso,
    updatedAt: iso,
  } as const satisfies WithoutSystemFields<DocUser>
  const userId = await ctx.db.insert("users", toCreate)
  const userProfile: UserProfile = docUserToUserProfile({
    _id: userId,
    _creationTime: now.getTime(),
    ...toCreate,
  })

  // Create auth account
  await ctx.db.insert("authAccounts", {
    userId,
    provider: authProvider.provider,
    ...(authProvider.provider === loginProvider.oidc && { issuer: authProvider.issuer }),
    providerAccountId: authProvider.providerId,
    createdAt: iso,
    updatedAt: iso,
  })

  return createResult(userProfile)
}
