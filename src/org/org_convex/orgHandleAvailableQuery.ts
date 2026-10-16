import { v } from "convex/values"
import * as a from "valibot"
import { type QueryCtx, query } from "#convex/_generated/server.js"
import { createResult, type PromiseResult } from "#result"
import { orgGetByHandleFn } from "#src/org/org_convex/orgGetByHandleFn.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authQueryResult } from "#src/utils/convex_backend/authQueryResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"

export const orgHandleAvailableFields = valibotToConvex({ orgHandle: a.string() })

export type OrgHandleAvailableValidatorType = typeof orgHandleAvailableValidator.type
export const orgHandleAvailableValidator = v.object(orgHandleAvailableFields)

export const orgHandleAvailableQuery = query({
  args: createTokenValidator(orgHandleAvailableFields),
  handler: async (ctx, args) => authQueryResult(ctx, args, orgHandleAvailableQueryFn),
})

export async function orgHandleAvailableQueryFn(
  ctx: QueryCtx,
  args: OrgHandleAvailableValidatorType,
): PromiseResult<boolean> {
  const op = "orgHandleAvailableFn"
  const org = await orgGetByHandleFn(ctx, args.orgHandle)

  if (org) {
    return createResult(false)
  }
  return createResult(true)
}
