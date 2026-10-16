import type { PaginationOptions } from "convex/server"
import { v } from "convex/values"
import * as a from "valibot"
import { internalQuery, type QueryCtx, query } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import { fileDocToModel } from "#src/file/convex/fileDocToModel.ts"
import { fileGetByIdFn } from "#src/file/convex/fileGetByIdFn.ts"
import { resourceDocToModel } from "#src/resource/convex/resourceDocToModel.ts"
import { resourceGetDocFn } from "#src/resource/convex/resourceGetQuery.ts"
import type { ResourceFilesPageModel } from "#src/resource/model/ResourceFilesPageModel.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authQueryResult } from "#src/utils/convex_backend/authQueryResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"
import { paginationDefaultOptions } from "#src/utils/convex_backend/paginationDefaultOptions.ts"
import { paginationOptsValidator } from "#src/utils/convex_backend/paginationOptsValidator.ts"
import { notEmptyFilter } from "#utils/arr/notEmptyFilter.js"

const resourceFilesGetSchemaFields = {
  resourceId: a.string(),
  updatedAt: a.optional(a.string()),
} as const

export const resourceFilesGetFields = {
  ...valibotToConvex(resourceFilesGetSchemaFields),
  paginationOpts: paginationOptsValidator,
} as const

export type ResourceFilesGetValidatorType = typeof resourceFilesGetValidator.type
export const resourceFilesGetValidator = v.object(resourceFilesGetFields)

export const resourceFilesGetQuery = query({
  args: createTokenValidator(resourceFilesGetFields),
  handler: async (ctx, args) => authQueryResult(ctx, args, resourceFilesGetFn),
})

export const resourceFilesGetInternalQuery = internalQuery({
  args: resourceFilesGetValidator,
  handler: resourceFilesGetFn,
})

export async function resourceFilesGetFn(
  ctx: QueryCtx,
  args: ResourceFilesGetValidatorType,
): PromiseResult<ResourceFilesPageModel | null> {
  const op = "resourceFilesGetFn"

  const resourceFiles = await resourceFilesGetModelFn(
    ctx,
    args.resourceId,
    args.paginationOpts ?? paginationDefaultOptions,
  )
  if (!resourceFiles) {
    return createResultError(op, "Resource not found", args.resourceId)
  }
  if (args.updatedAt && args.updatedAt === resourceFiles.resource.updatedAt) {
    return createResult(null)
  }
  return createResult(resourceFiles)
}

export async function resourceFilesGetModelFn(
  ctx: QueryCtx,
  resourceId: string,
  paginationOpts: Pick<PaginationOptions, "numItems" | "cursor"> = paginationDefaultOptions,
): Promise<ResourceFilesPageModel | null> {
  const resourceDoc = await resourceGetDocFn(ctx, resourceId)
  if (!resourceDoc) return null

  const resource = resourceDocToModel(resourceDoc)

  const list = await ctx.db
    .query("resourceFiles")
    .withIndex("resourceId", (q) => q.eq("resourceId", resourceId))
    .paginate(paginationOpts)

  const all = await Promise.all(list.page.map((mr) => fileGetByIdFn(ctx, mr.fileId)))
  const filtered = all.filter(notEmptyFilter)
  const files = {
    ...list,
    page: filtered.map(fileDocToModel),
  }

  return { resource, files }
}
