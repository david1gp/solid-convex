import { v } from "convex/values"
import * as a from "valibot"
import { type QueryCtx, query } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import { docOrgToModel } from "#src/org/org_convex/docOrgInvitationToModel.ts"
import type { DocOrg } from "#src/org/org_convex/IdOrg.ts"
import { orgGetByHandleFn } from "#src/org/org_convex/orgGetByHandleFn.ts"
import type { OrgViewPageType } from "#src/org/org_model/OrgViewPageType.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authQueryResult } from "#src/utils/convex_backend/authQueryResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"

export const orgGetPageFields = valibotToConvex({ orgHandle: a.string() })

export type OrgGetPageValidatorType = typeof orgGetPageValidator.type
export const orgGetPageValidator = v.object(orgGetPageFields)

export const orgGetPageQuery = query({
  args: createTokenValidator(orgGetPageFields),
  handler: async (ctx, args) => authQueryResult(ctx, args, orgGetPageQueryFn),
})

export async function orgGetPageQueryFn(ctx: QueryCtx, args: OrgGetPageValidatorType): PromiseResult<OrgViewPageType> {
  const op = "orgGetPageFn"

  const org: DocOrg | null = await orgGetByHandleFn(ctx, args.orgHandle)
  if (!org) {
    return createResultError(op, "Organization not found", args.orgHandle)
  }

  return createResult({ org: docOrgToModel(org) })
}
