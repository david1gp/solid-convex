import type { MutationCtx } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import type { DocUser, IdUser } from "#src/auth/convex/IdUser.ts"
import { loginProvider } from "#src/auth/model_field/socialLoginProvider.ts"
import { userRoleEffectiveGet } from "#src/auth/model_field/userRoleEffectiveGet.ts"
import type { CommonAuthProvider } from "#src/auth/server/social_identity_providers/CommonAuthProvider.ts"

export async function userRoleSyncFromAuthProviderFn(
  ctx: MutationCtx,
  userId: IdUser,
  authProvider: CommonAuthProvider,
): PromiseResult<DocUser> {
  const op = "userRoleSyncFromAuthProviderFn"
  const user = await ctx.db.get("users", userId)
  if (!user) return createResultError(op, "User not found by userId", userId)
  if (authProvider.provider !== loginProvider.oidc) return createResult(user)
  if (authProvider.role === undefined && authProvider.roles === undefined) return createResult(user)

  const targetRole = authProvider.roles !== undefined ? userRoleEffectiveGet(authProvider.roles) : authProvider.role!

  const rolesChanged =
    authProvider.roles !== undefined &&
    (!user.roles ||
      user.roles.length !== authProvider.roles.length ||
      !authProvider.roles.every((r) => user.roles?.includes(r)))

  const roleChanged = user.role !== targetRole

  if (!roleChanged && !rolesChanged) return createResult(user)

  const updatedAt = new Date().toISOString()
  const patchData = {
    role: targetRole,
    ...(authProvider.roles !== undefined ? { roles: authProvider.roles } : {}),
    updatedAt,
  }
  await ctx.db.patch("users", userId, patchData)
  return createResult({ ...user, ...patchData })
}
