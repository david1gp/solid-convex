import { v } from "convex/values"
import * as a from "valibot"
import { internalQuery, type QueryCtx, query } from "#convex/_generated/server.js"
import { languageSchema } from "#src/app/i18n/language.ts"
import type { DocOrgResource } from "#src/resource/convex/IdResource.ts"
import { resourceDocToModel } from "#src/resource/convex/resourceDocToModel.ts"
import type { ResourceModel } from "#src/resource/model/ResourceModel.ts"
import { resourceTypeSchema } from "#src/resource/model_field/resourceType.ts"
import { visibilitySchema } from "#src/resource/model_field/visibility.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authQueryWrapResult } from "#src/utils/convex_backend/authQueryWrapResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"
import { paginationDefaultOptions } from "#src/utils/convex_backend/paginationDefaultOptions.ts"
import { paginationOptsValidator } from "#src/utils/convex_backend/paginationOptsValidator.ts"
import { paginationResultMap } from "#src/utils/convex_backend/paginationResultMap.ts"
import type { PaginationResultType } from "#src/utils/convex_backend/paginationResultType.ts"
import { notEmptyFilter } from "#utils/arr/notEmptyFilter.js"

const resourceListSchemaFields = {
  l: a.optional(languageSchema),
  orgHandle: a.optional(a.string()),
  meetingId: a.optional(a.string()),
  type: a.optional(resourceTypeSchema),
  visibility: a.optional(visibilitySchema),
  searchText: a.optional(a.string()),
} as const

export const resourceListFields = {
  ...valibotToConvex(resourceListSchemaFields),
  paginationOpts: paginationOptsValidator,
} as const

export type ResourceListValidatorType = typeof resourceListValidator.type
export const resourceListValidator = v.object(resourceListFields)

export const resourcesListQuery = query({
  args: createTokenValidator(resourceListFields),
  handler: async (ctx, args) => authQueryWrapResult(ctx, args, resourceListFn),
})

export const resourcesListInternalQuery = internalQuery({
  args: resourceListValidator,
  handler: resourceListFn,
})

export async function resourceListFn(
  ctx: QueryCtx,
  args: ResourceListValidatorType,
): Promise<PaginationResultType<ResourceModel>> {
  if (args.orgHandle) {
    return await resourceListForOrg(ctx, args)
  }

  const resources = await resourceQuery(ctx, args).paginate(args.paginationOpts ?? paginationDefaultOptions)
  return paginationResultMap(resources, resourceDocToModel)
}

function resourceQuery(ctx: QueryCtx, args: ResourceListValidatorType) {
  const searchText = args.searchText?.trim()
  if (searchText) {
    return ctx.db.query("resources").withSearchIndex("search", (q) => {
      let filter = q.search("searchText", searchText).eq("deletedAt", undefined)
      if (args.type) filter = filter.eq("type", args.type)
      if (args.visibility) filter = filter.eq("visibility", args.visibility)
      if (args.l) filter = filter.eq("language", args.l)
      return filter
    })
  }

  const filters = [args.type, args.visibility, args.l].filter((value) => value !== undefined)
  const resources = args.type
    ? ctx.db.query("resources").withIndex("type", (q) => q.eq("type", args.type))
    : args.visibility
      ? ctx.db.query("resources").withIndex("visibility", (q) => q.eq("visibility", args.visibility))
      : args.l
        ? ctx.db.query("resources").withIndex("language", (q) => q.eq("language", args.l))
        : ctx.db.query("resources").withIndex("deletedAt", (q) => q.eq("deletedAt", undefined))
  if (filters.length === 0) return resources

  return resources.filter((q) => {
    const expressions = [q.eq(q.field("deletedAt"), undefined)]
    if (args.type) expressions.push(q.eq(q.field("type"), args.type))
    if (args.visibility) expressions.push(q.eq(q.field("visibility"), args.visibility))
    if (args.l) expressions.push(q.eq(q.field("language"), args.l))
    return q.and(...expressions)
  })
}

async function resourceListForOrg(
  ctx: QueryCtx,
  args: ResourceListValidatorType,
): Promise<PaginationResultType<ResourceModel>> {
  const orgResources = await orgResourceQuery(ctx, args).paginate(args.paginationOpts ?? paginationDefaultOptions)
  const models = await Promise.all(
    orgResources.page.map((orgResource) => resourceModelForOrgResource(ctx, orgResource)),
  )

  return {
    ...orgResources,
    page: models.filter(notEmptyFilter),
  }
}

function orgResourceQuery(ctx: QueryCtx, args: ResourceListValidatorType) {
  const searchText = args.searchText?.trim()
  if (searchText) {
    return ctx.db.query("orgResources").withSearchIndex("search", (q) => {
      let filter = q.search("searchText", searchText).eq("orgHandle", args.orgHandle as string)
      if (args.type) filter = filter.eq("type", args.type)
      if (args.visibility) filter = filter.eq("visibility", args.visibility)
      if (args.l) filter = filter.eq("language", args.l)
      return filter
    })
  }

  const orgResources = ctx.db
    .query("orgResources")
    .withIndex("orgHandle", (q) => q.eq("orgHandle", args.orgHandle as string))
  const filters = [args.type, args.visibility, args.l].filter((value) => value !== undefined)
  if (filters.length === 0) return orgResources

  return orgResources.filter((q) => {
    const expressions = []
    if (args.type) expressions.push(q.eq(q.field("type"), args.type))
    if (args.visibility) expressions.push(q.eq(q.field("visibility"), args.visibility))
    if (args.l) expressions.push(q.eq(q.field("language"), args.l))
    return q.and(...expressions)
  })
}

async function resourceModelForOrgResource(ctx: QueryCtx, orgResource: DocOrgResource): Promise<ResourceModel | null> {
  const resource = await ctx.db
    .query("resources")
    .withIndex("resourceId", (q) => q.eq("resourceId", orgResource.resourceId))
    .unique()
  return resource && !resource.deletedAt ? resourceDocToModel(resource) : null
}
