import { v } from "convex/values"
import { internalMutation, type MutationCtx, mutation } from "#convex/_generated/server.js"
import { createResult, type PromiseResult } from "#result"
import {
  fileCreateFields,
  fileCreateFn,
  fileCreateValidator,
  type FileCreateValidatorType,
} from "#src/file/convex/fileCreateMutation.ts"
import { authMutationTokenToUserId } from "#src/utils/convex_backend/authMutationTokenToUserId.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"

export const r2FileCreateFields = fileCreateFields
export const r2FileCreateValidator = fileCreateValidator
export type R2FileCreateValidatorType = typeof r2FileCreateValidator.type

export const r2FileCreateMutation = mutation({
  args: createTokenValidator(r2FileCreateFields),
  handler: async (ctx, args) =>
    authMutationTokenToUserId(ctx, args, async (ctx, authedArgs) => {
      const { token: _token, ...rest } = authedArgs as any
      return r2FileCreateFn(ctx, rest)
    }),
})

export const r2FileCreateInternalMutation = internalMutation({
  args: r2FileCreateValidator,
  handler: r2FileCreateFn,
})

export async function r2FileCreateFn(ctx: MutationCtx, args: FileCreateValidatorType): PromiseResult<null> {
  const op = "r2FileCreateFn"
  const result = await fileCreateFn(ctx, args)
  if (!result.success) return result
  return createResult(null)
}
