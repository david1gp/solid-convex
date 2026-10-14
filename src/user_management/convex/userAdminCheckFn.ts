import type { MutationCtx, QueryCtx } from "#convex/_generated/server.js"
import { createResult, createResultError } from "#result"
import type { PromiseResult } from "#result"
import type { DocUser } from "#src/auth/convex/IdUser.ts"
import { userRoleEffectiveGet } from "#src/auth/model_field/userRoleEffectiveGet.ts"
import { authCredentialResolve } from "#src/utils/convex_backend/authCredentialResolve.ts"

export async function userAdminCheckFn(ctx: QueryCtx | MutationCtx, token: string): PromiseResult<DocUser> {
  const op = "userAdminCheckFn"
  if (!token) {
    return createResultError(op, "Missing auth token")
  }

  const credentialResult = await authCredentialResolve(ctx, token)
  if (!credentialResult.success) {
    return credentialResult
  }

  const user = await ctx.db.get("users", credentialResult.data.userId)
  if (!user || user.deletedAt) {
    return createResultError(op, "User not found or deleted")
  }

  const effectiveRole = user.roles !== undefined ? userRoleEffectiveGet(user.roles) : (user.role ?? "user")

  if (effectiveRole !== "admin") {
    return createResultError(op, "Admin authorization required")
  }

  return createResult(user)
}
