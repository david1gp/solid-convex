import { v } from "convex/values"
import * as a from "valibot"
import { internalMutation, type MutationCtx, mutation } from "#convex/_generated/server.js"
import type { DocKv } from "#src/file/kv/IdKv.ts"
import { kvGetQueryFn2 } from "#src/file/kv/kvGetQuery.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authMutationWrapResult } from "#src/utils/convex_backend/authMutationWrapResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"

export type KvSetType = typeof kvSetValidator.type

const kvSetSchemaFields = {
  key: a.string(),
  data: a.string(),
  updatedAt: a.optional(a.string()),
} as const
export const kvSetFields = valibotToConvex(kvSetSchemaFields)

export const kvSetValidator = v.object(kvSetFields)

export const kvSetMutation = mutation({
  args: createTokenValidator(kvSetFields),
  handler: async (ctx, args) => {
    return authMutationWrapResult(ctx, args, kvSetMutationFn)
  },
})

export const kvSetInternalMutation = internalMutation({
  args: kvSetValidator,
  handler: kvSetMutationFn,
})

export async function kvSetMutationFn(ctx: MutationCtx, args: KvSetType): Promise<boolean | null> {
  return kvSetMutationFn2(ctx, args.key, args.data)
}

export async function kvSetMutationFn2(
  ctx: MutationCtx,
  key: string,
  data: string,
  exists?: DocKv | undefined | null,
): Promise<boolean | null> {
  // If exists is not provided, check if a document with this key exists
  let existingDoc = exists
  if (!existingDoc) {
    existingDoc = await kvGetQueryFn2(ctx, key)
  }

  if (existingDoc) {
    // Update existing document
    await ctx.db.patch("kv", existingDoc._id, {
      data: data,
      updatedAt: new Date().toISOString(),
    })
    return true
  }
  // Insert new document
  await ctx.db.insert("kv", {
    key,
    data,
    updatedAt: new Date().toISOString(),
  })
  return false
}
