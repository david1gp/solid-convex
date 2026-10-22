import { v } from "convex/values"
import * as a from "valibot"
import { type QueryCtx, query } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import { docOrgInvitationToModel } from "#src/org/invitation_convex/docOrgInvitationToModel.ts"
import type { OrgInvitationModel } from "#src/org/invitation_model/orgInvitationSchema.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { paginationDefaultOptions } from "#src/utils/convex_backend/paginationDefaultOptions.ts"
import { paginationOptsValidator } from "#src/utils/convex_backend/paginationOptsValidator.ts"
import { paginationResultMap } from "#src/utils/convex_backend/paginationResultMap.ts"
import type { PaginationResultType } from "#src/utils/convex_backend/paginationResultType.ts"

export const orgInvitationsListFields = {
  ...valibotToConvex({ orgHandle: a.string(), token: a.string() }),
  paginationOpts: paginationOptsValidator,
} as const

export type OrgInvitationsListValidatorType = typeof orgInvitationsListValidator.type
export const orgInvitationsListValidator = v.object(orgInvitationsListFields)

export const orgInvitationsListQuery = query({
  args: orgInvitationsListValidator,
  handler: orgInvitation10ListFn,
})

export async function orgInvitation10ListFn(
  ctx: QueryCtx,
  args: OrgInvitationsListValidatorType,
): PromiseResult<PaginationResultType<OrgInvitationModel>> {
  const op = "orgInvitationsListFn"

  const org = await ctx.db
    .query("orgs")
    .withIndex("orgHandle", (q) => q.eq("orgHandle", args.orgHandle))
    .unique()
  if (!org) {
    return createResultError(op, "Organization not found", args.orgHandle)
  }

  const invitations = await ctx.db
    .query("orgInvitations")
    .withIndex("orgHandle", (q) => q.eq("orgHandle", org.orgHandle))
    .paginate(args.paginationOpts ?? paginationDefaultOptions)

  return createResult(paginationResultMap(invitations, docOrgInvitationToModel))
}
