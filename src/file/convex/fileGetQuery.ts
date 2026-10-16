import { v } from "convex/values"
import * as a from "valibot"
import { internalQuery, type QueryCtx, query } from "#convex/_generated/server.js"
import { createResult, type PromiseResult } from "#result"
import { fileDocToModel } from "#src/file/convex/fileDocToModel.ts"
import { fileGetByIdFn } from "#src/file/convex/fileGetByIdFn.ts"
import type { FileModel } from "#src/file/model/FileModel.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authQueryResult } from "#src/utils/convex_backend/authQueryResult.ts"
import { createErrorAndLogWarn } from "#src/utils/convex_backend/createErrorAndLogWarn.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"

const fileGetSchemaFields = {
  fileId: a.string(),
  updatedAt: a.optional(a.string()),
} as const

export const fileGetFields = valibotToConvex(fileGetSchemaFields)

export type FileGetValidatorType = typeof fileGetValidator.type
export const fileGetValidator = v.object(fileGetFields)

export const fileGetQuery = query({
  args: createTokenValidator(fileGetFields),
  handler: async (ctx, args) => authQueryResult(ctx, args, fileGetFn),
})

export const fileGetInternalQuery = internalQuery({
  args: fileGetValidator,
  handler: fileGetFn,
})

export async function fileGetFn(ctx: QueryCtx, args: FileGetValidatorType): PromiseResult<FileModel | null> {
  const op = "fileGetFn"

  const file = await fileGetByIdFn(ctx, args.fileId)
  if (!file) {
    return createErrorAndLogWarn(op, "File not found", args.fileId)
  }
  if (args.updatedAt && args.updatedAt === file.updatedAt) {
    return createResult(null)
  }
  return createResult(fileDocToModel(file))
}
