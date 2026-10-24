import { v } from "convex/values"
import { internal } from "#convex/_generated/api.js"
import { type MutationCtx, mutation } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import type { IdUser } from "#src/auth/convex/IdUser.ts"
import { apiKeyCredentialGenerate } from "#src/auth/model/apiKeyCredentialGenerate.ts"
import { apiKeyCredentialHash } from "#src/auth/model/apiKeyCredentialHash.ts"
import { authMutationTokenToUserId } from "#src/utils/convex_backend/authMutationTokenToUserId.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"
import { nowIso } from "#utils/date/nowIso.js"

const argsValidator = createTokenValidator({ id: v.id("authApiKeys") })

export const apiKeyRotateMutation = mutation({
  args: argsValidator,
  handler: async (ctx, args) => authMutationTokenToUserId(ctx, args, apiKeyRotateMutationFn),
})

async function apiKeyRotateMutationFn(
  ctx: MutationCtx,
  args: { id: typeof argsValidator.type.id; userId: IdUser },
): PromiseResult<{ id: string; credential: string }> {
  const key = await ctx.db.get("authApiKeys", args.id)
  if (!key || key.userId !== args.userId) return createResultError("apiKeyRotateMutation", "API key not found")
  if (key.revokedAt) return createResultError("apiKeyRotateMutation", "API key is already revoked")
  if (key.expiredAt || (key.expiresAt && Date.parse(key.expiresAt) <= Date.now())) {
    return createResultError("apiKeyRotateMutation", "API key is expired")
  }

  const generated = apiKeyCredentialGenerate()
  const digest = await apiKeyCredentialHash(generated.credential)
  const now = nowIso()
  await ctx.db.patch("authApiKeys", key._id, { revokedAt: now })
  const id = await ctx.db.insert("authApiKeys", {
    userId: key.userId,
    name: key.name,
    digest,
    previewFirst3: generated.previewFirst3,
    previewLast3: generated.previewLast3,
    createdAt: now,
    ...(key.expiresAt && { expiresAt: key.expiresAt }),
  })
  if (key.expiresAt) {
    await ctx.scheduler.runAt(new Date(key.expiresAt), internal.auth.apiKeyExpireInternalMutation, { id })
  }
  console.info("apiKeyRotateMutation", { userId: args.userId })
  return createResult({ id, credential: generated.credential })
}
