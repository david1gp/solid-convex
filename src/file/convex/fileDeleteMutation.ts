import { v } from "convex/values"
import * as a from "valibot"
import { internalMutation, type MutationCtx, mutation } from "#convex/_generated/server.js"
import { fileGetByIdFn } from "#src/file/convex/fileGetByIdFn.ts"
import { resourceFileRemoveMutationFn } from "#src/resource/convex/resourceFileRemoveMutation.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authMutationWrapResult } from "#src/utils/convex_backend/authMutationWrapResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"

export type FileDeleteValidatorType = typeof fileDeleteValidator.type

const fileDeleteSchemaFields = { fileId: a.string() } as const
export const fileDeleteFields = valibotToConvex(fileDeleteSchemaFields)

export const fileDeleteValidator = v.object(fileDeleteFields)

export const fileDeleteMutation = mutation({
  args: createTokenValidator(fileDeleteFields),
  handler: async (ctx, args) => authMutationWrapResult(ctx, args, fileDeleteFn),
})

export const fileDeleteInternalMutation = internalMutation({
  args: fileDeleteValidator,
  handler: fileDeleteFn,
})

export async function fileDeleteFn(ctx: MutationCtx, args: FileDeleteValidatorType): Promise<null> {
  const op = "fileDeleteFn"
  const file = await fileGetByIdFn(ctx, args.fileId)
  if (!file) return null // idempotent
  // ctx.db.patch(file._id, { deletedAt: nowIso() })
  const resourceId = file.resourceId
  if (resourceId) {
    await resourceFileRemoveMutationFn(ctx, {
      resourceId: resourceId,
      fileId: args.fileId,
    })
  }
  await ctx.db.delete("files", file._id)
  console.info(op, { fileId: args.fileId })
  return null
}
