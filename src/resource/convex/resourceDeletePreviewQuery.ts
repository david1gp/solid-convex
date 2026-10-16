import { v } from "convex/values"
import * as a from "valibot"
import { internalQuery, type QueryCtx, query } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import { resourceGetDocFn } from "#src/resource/convex/resourceGetQuery.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authQueryResult } from "#src/utils/convex_backend/authQueryResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"

const resourceDeletePreviewSchemaFields = {
  resourceId: a.string(),
  limit: a.optional(a.number()),
} as const

export const resourceDeletePreviewFields = valibotToConvex(resourceDeletePreviewSchemaFields)
export const resourceDeletePreviewValidator = v.object(resourceDeletePreviewFields)

export interface ResourceDeletePreviewData {
  resourceId: string
  name?: string
  linkedFilesCount: number
  isTruncated: boolean
}

export const resourceDeletePreviewQuery = query({
  args: createTokenValidator(resourceDeletePreviewFields),
  handler: async (ctx, args) => authQueryResult(ctx, args, resourceDeletePreviewFn),
})

export const resourceDeletePreviewInternalQuery = internalQuery({
  args: resourceDeletePreviewValidator,
  handler: resourceDeletePreviewFn,
})

export async function resourceDeletePreviewFn(
  ctx: QueryCtx,
  args: { resourceId: string; limit?: number },
): PromiseResult<ResourceDeletePreviewData> {
  const op = "resourceDeletePreviewFn"
  const limit = args.limit ?? 100

  const resource = await resourceGetDocFn(ctx, args.resourceId)
  if (!resource) {
    return createResultError(op, "Resource not found", args.resourceId)
  }

  const relationships = await ctx.db
    .query("resourceFiles")
    .withIndex("resourceId", (q) => q.eq("resourceId", args.resourceId))
    .take(limit + 1)

  const isTruncated = relationships.length > limit
  const linkedFilesCount = isTruncated ? limit : relationships.length

  return createResult({
    resourceId: resource.resourceId,
    name: resource.name,
    linkedFilesCount,
    isTruncated,
  })
}
