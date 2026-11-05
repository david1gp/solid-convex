import type { MutationCtx, QueryCtx } from "#convex/_generated/server.js"
import { createResult, createResultError } from "#result"
import { privateEnvVariableName } from "#src/app/env/privateEnvVariableName.ts"
import { authCredentialResolve } from "#src/utils/convex_backend/authCredentialResolve.ts"

// The permanent test identity is configured by immutable local user ID, not a mutable name/email.
// No default: deployments without this explicit allowlist cannot mark or clean sessions.
export async function authSessionE2eCallerAuthorize(ctx: QueryCtx | MutationCtx, token?: string) {
  const op = "authSessionE2eCallerAuthorize"
  const configuredId = process.env[privateEnvVariableName.E2E_AUTH_USER_ID]?.trim()
  const userId = configuredId ? ctx.db.normalizeId("users", configuredId) : null
  if (!userId) return createResultError(op, "Permanent E2E auth user is not configured")
  const testUser = await ctx.db.get("users", userId)
  if (!testUser || testUser.deletedAt) return createResultError(op, "Permanent E2E auth user is unavailable")

  if (token === undefined) return createResult({ userId })
  const credential = await authCredentialResolve(ctx, token)
  if (!credential.success) return credential
  const caller = await ctx.db.get("users", credential.data.userId)
  if (!caller || caller.deletedAt) return createResultError(op, "Auth user is unavailable")
  if (caller._id !== userId) return createResultError(op, "Permanent E2E auth user authorization required")
  if (credential.data.kind !== "jwt") return createResultError(op, "A current E2E session token is required")
  return createResult({ userId })
}
