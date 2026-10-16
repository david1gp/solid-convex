import { v } from "convex/values"
import * as a from "valibot"
import { internalQuery, type QueryCtx, query } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import type { DocResource } from "#src/resource/convex/IdResource.ts"
import { resourceDocToModel } from "#src/resource/convex/resourceDocToModel.ts"
import type { ResourceModel } from "#src/resource/model/ResourceModel.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authQueryResult } from "#src/utils/convex_backend/authQueryResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"

const resourceGetSchemaFields = {
  resourceId: a.string(),
  updatedAt: a.optional(a.string()),
} as const
export const resourceGetFields = valibotToConvex(resourceGetSchemaFields)

export type ResourceGetValidatorType = typeof resourceGetValidator.type
export const resourceGetValidator = v.object(resourceGetFields)

export const resourceGetQuery = query({
  args: createTokenValidator(resourceGetFields),
  handler: async (ctx, args) => authQueryResult(ctx, args, resourceGetFn),
})

export const resourceGetInternalQuery = internalQuery({
  args: resourceGetValidator,
  handler: resourceGetFn,
})

export async function resourceGetFn(
  ctx: QueryCtx,
  args: ResourceGetValidatorType,
): PromiseResult<ResourceModel | null> {
  const op = "resourceGetFn"

  const resource = await resourceGetModelFn(ctx, args.resourceId)
  if (!resource) {
    return createResultError(op, "Resource not found", args.resourceId)
  }
  if (args.updatedAt && args.updatedAt === resource.updatedAt) {
    return createResult(null)
  }
  return createResult(resource)
}

export async function resourceGetDocFn(ctx: QueryCtx, resourceId: string): Promise<DocResource | null> {
  const resource = await ctx.db
    .query("resources")
    .withIndex("resourceId", (q) => q.eq("resourceId", resourceId))
    .unique()
  if (resource?.deletedAt) return null
  return resource
}

export async function resourceGetModelFn(ctx: QueryCtx, resourceId: string): Promise<ResourceModel | null> {
  const got = await resourceGetDocFn(ctx, resourceId)
  if (!got) return got
  return resourceDocToModel(got)
}
