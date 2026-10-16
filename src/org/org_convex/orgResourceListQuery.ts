import { v } from "convex/values"
import * as a from "valibot"
import { internalQuery, type QueryCtx, query } from "#convex/_generated/server.js"
import { languageSchema } from "#src/app/i18n/language.ts"
import { resourceGetModelFn } from "#src/resource/convex/resourceGetQuery.ts"
import type { ResourceModel } from "#src/resource/model/ResourceModel.ts"
import { resourceTypeSchema } from "#src/resource/model_field/resourceType.ts"
import { visibilitySchema } from "#src/resource/model_field/visibility.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authQueryWrapResult } from "#src/utils/convex_backend/authQueryWrapResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"
import { paginationDefaultOptions } from "#src/utils/convex_backend/paginationDefaultOptions.ts"
import { paginationOptsValidator } from "#src/utils/convex_backend/paginationOptsValidator.ts"
import type { PaginationResultType } from "#src/utils/convex_backend/paginationResultType.ts"

export type OrgResourceListValidatorType = typeof orgResourceListValidator.type

export const orgResourceListFields = {
  ...valibotToConvex({
    orgHandle: a.string(),
    l: a.optional(languageSchema),
    type: a.optional(resourceTypeSchema),
    visibility: a.optional(visibilitySchema),
    searchText: a.optional(a.string()),
  }),
  paginationOpts: paginationOptsValidator,
} as const

export const orgResourceListValidator = v.object(orgResourceListFields)

export const orgResourceListQuery = query({
  args: createTokenValidator(orgResourceListFields),
  handler: async (ctx, args) => authQueryWrapResult(ctx, args, orgResourceListFn),
})

export const orgResourceListInternalQuery = internalQuery({
  args: orgResourceListValidator,
  handler: orgResourceListFn,
})

export async function orgResourceListFn(
  ctx: QueryCtx,
  args: OrgResourceListValidatorType,
): Promise<PaginationResultType<ResourceModel>> {
  const resources = await orgResourceQuery(ctx, args).paginate(args.paginationOpts ?? paginationDefaultOptions)
  const page = await Promise.all(resources.page.map((orgResource) => resourceGetModelFn(ctx, orgResource.resourceId)))

  return {
    isDone: resources.isDone,
    continueCursor: resources.continueCursor,
    page: page.filter((resource): resource is ResourceModel => resource !== null),
  }
}

function orgResourceQuery(ctx: QueryCtx, args: OrgResourceListValidatorType) {
  const searchText = args.searchText?.trim()
  if (searchText) {
    return ctx.db.query("orgResources").withSearchIndex("search", (q) => {
      let filter = q.search("searchText", searchText).eq("orgHandle", args.orgHandle)
      if (args.type) filter = filter.eq("type", args.type)
      if (args.visibility) filter = filter.eq("visibility", args.visibility)
      if (args.l) filter = filter.eq("language", args.l)
      return filter
    })
  }

  const orgResources = ctx.db.query("orgResources").withIndex("orgHandle", (q) => q.eq("orgHandle", args.orgHandle))
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
