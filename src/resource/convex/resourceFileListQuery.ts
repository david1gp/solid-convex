import { v } from "convex/values"
import * as a from "valibot"
import { internalQuery, type QueryCtx, query } from "#convex/_generated/server.js"
import { fileDocToModel } from "#src/file/convex/fileDocToModel.ts"
import { fileGetByIdFn } from "#src/file/convex/fileGetByIdFn.ts"
import type { FileModel } from "#src/file/model/FileModel.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authQueryWrapResult } from "#src/utils/convex_backend/authQueryWrapResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"
import { paginationDefaultOptions } from "#src/utils/convex_backend/paginationDefaultOptions.ts"
import { paginationOptsValidator } from "#src/utils/convex_backend/paginationOptsValidator.ts"
import type { PaginationResultType } from "#src/utils/convex_backend/paginationResultType.ts"
import { notEmptyFilter } from "#utils/arr/notEmptyFilter.js"

export type ResourceFileListValidatorType = typeof resourceFileListValidator.type

const resourceFileListSchemaFields = { resourceId: a.string() } as const

export const resourceFileListFields = {
  ...valibotToConvex(resourceFileListSchemaFields),
  paginationOpts: paginationOptsValidator,
} as const

export const resourceFileListValidator = v.object(resourceFileListFields)

export const resourceFileListQuery = query({
  args: createTokenValidator(resourceFileListFields),
  handler: async (ctx, args) => authQueryWrapResult(ctx, args, resourceFileListFn),
})

export const resourceFileListInternalQuery = internalQuery({
  args: resourceFileListValidator,
  handler: resourceFileListFn,
})

export async function resourceFileListFn(
  ctx: QueryCtx,
  args: ResourceFileListValidatorType,
): Promise<PaginationResultType<FileModel>> {
  const list = await ctx.db
    .query("resourceFiles")
    .withIndex("resourceId", (q) => q.eq("resourceId", args.resourceId))
    .paginate(args.paginationOpts ?? paginationDefaultOptions)
  const all = await Promise.all(list.page.map((mr) => fileGetByIdFn(ctx, mr.fileId)))
  const filtered = all.filter(notEmptyFilter)
  return {
    ...list,
    page: filtered.map(fileDocToModel),
  }
}
