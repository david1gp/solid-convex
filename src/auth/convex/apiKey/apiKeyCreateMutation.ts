import { v } from "convex/values"
import * as a from "valibot"
import { internal } from "#convex/_generated/api.js"
import { type MutationCtx, mutation } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import type { IdUser } from "#src/auth/convex/IdUser.ts"
import { apiKeyCredentialGenerate } from "#src/auth/model/apiKeyCredentialGenerate.ts"
import { apiKeyCredentialHash } from "#src/auth/model/apiKeyCredentialHash.ts"
import { apiKeyExpiresAtCreate } from "#src/auth/model/apiKeyExpiresAtCreate.ts"
import type { ApiKeyExpiryPreset } from "#src/auth/model/apiKeyExpiryPreset.ts"
import { apiKeyNameSchema } from "#src/auth/model/apiKeyNameSchema.ts"
import { authMutationTokenToUserId } from "#src/utils/convex_backend/authMutationTokenToUserId.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"
import { nowIso } from "#utils/date/nowIso.js"

const argsValidator = createTokenValidator({
  name: v.string(),
  expiryPreset: v.optional(
    v.union(
      v.literal("never"),
      v.literal("1-day"),
      v.literal("1-week"),
      v.literal("1-month"),
      v.literal("1-year"),
      v.literal("2-years"),
      v.literal("3-years"),
    ),
  ),
})

export const apiKeyCreateMutation = mutation({
  args: argsValidator,
  handler: async (ctx, args) => authMutationTokenToUserId(ctx, args, apiKeyCreateMutationFn),
})

async function apiKeyCreateMutationFn(
  ctx: MutationCtx,
  args: { name: string; expiryPreset?: ApiKeyExpiryPreset; userId: IdUser },
): PromiseResult<{ id: string; credential: string }> {
  const parsedName = a.safeParse(apiKeyNameSchema, args.name)
  if (!parsedName.success) return createResultError("apiKeyCreateMutation", "Name must be 1–80 characters")
  const name = parsedName.output
  if (!(await ctx.db.get("users", args.userId))) return createResultError("apiKeyCreateMutation", "User not found")

  const generated = apiKeyCredentialGenerate()
  const digest = await apiKeyCredentialHash(generated.credential)
  const expiresAt = apiKeyExpiresAtCreate(args.expiryPreset)
  const id = await ctx.db.insert("authApiKeys", {
    userId: args.userId,
    name,
    digest,
    previewFirst3: generated.previewFirst3,
    previewLast3: generated.previewLast3,
    createdAt: nowIso(),
    expiresAt,
  })
  if (expiresAt) {
    await ctx.scheduler.runAt(new Date(expiresAt), internal.auth.apiKeyExpireInternalMutation, { id })
  }
  console.info("apiKeyCreateMutation", { userId: args.userId })
  return createResult({ id, credential: generated.credential })
}
