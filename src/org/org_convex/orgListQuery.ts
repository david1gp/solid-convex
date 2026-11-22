import { v } from "convex/values"
import { type QueryCtx, query } from "#convex/_generated/server.js"
import { createResult, type PromiseResult } from "#result"
import type { DocOrg } from "#src/org/org_convex/IdOrg.ts"
import { authQueryResult } from "#src/utils/convex_backend/authQueryResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"
import { paginationDefaultOptions } from "#src/utils/convex_backend/paginationDefaultOptions.ts"
import { paginationOptsValidator } from "#src/utils/convex_backend/paginationOptsValidator.ts"
import { paginationResultMap } from "#src/utils/convex_backend/paginationResultMap.ts"
import type { PaginationResultType } from "#src/utils/convex_backend/paginationResultType.ts"

export type OrgListValidatorType = typeof orgListValidator.type

export const orgListFields = {
  paginationOpts: paginationOptsValidator,
} as const

export const orgListValidator = v.object(orgListFields)

export const orgListQuery = query({
  args: createTokenValidator(orgListFields),
  handler: async (ctx, args) => authQueryResult(ctx, args, orgListQueryFn),
})

export async function orgListQueryFn(
  ctx: QueryCtx,
  args: OrgListValidatorType,
): PromiseResult<PaginationResultType<DocOrg>> {
  const result = await ctx.db.query("orgs").paginate(args.paginationOpts ?? paginationDefaultOptions)
  return createResult(
    paginationResultMap({ ...result, page: result.page.filter((org) => !org.deleting) }, (org) => org),
  )
}
