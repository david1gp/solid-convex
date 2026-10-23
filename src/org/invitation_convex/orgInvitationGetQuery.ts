import { v } from "convex/values"
import * as a from "valibot"
import { internalQuery, type QueryCtx, query } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import { docOrgInvitationToModel } from "#src/org/invitation_convex/docOrgInvitationToModel.ts"
import type { DocOrgInvitation } from "#src/org/invitation_convex/IdOrgInvitation.ts"
import type { OrgInvitationModel } from "#src/org/invitation_model/orgInvitationSchema.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"

export const orgInvitationGetFields = valibotToConvex({
  orgHandle: a.optional(a.string()),
  invitationCode: a.string(),
  updatedAt: a.optional(a.string()),
})

export type OrgInvitationGetValidatorType = typeof orgInvitationGetValidator.type
export const orgInvitationGetValidator = v.object(orgInvitationGetFields)

export const orgInvitationGetQuery = query({
  args: orgInvitationGetValidator,
  handler: orgInvitationGetFn,
})

export const orgInvitationGetInternalQuery = internalQuery({
  args: orgInvitationGetValidator,
  handler: orgInvitationGetInternalFn,
})

export async function orgInvitationGetFn(
  ctx: QueryCtx,
  args: OrgInvitationGetValidatorType,
): PromiseResult<OrgInvitationModel | null> {
  const op = "orgInvitationGetFn"

  const got = await orgInvitationGetInternalFn(ctx, args)
  if (!got.success) return got
  if (!got.data) return got
  return createResult(docOrgInvitationToModel(got.data))
}

export async function orgInvitationGetInternalFn(
  ctx: QueryCtx,
  args: OrgInvitationGetValidatorType,
): PromiseResult<DocOrgInvitation | null> {
  const op = "orgInvitationGetFn"

  if (!args.invitationCode) {
    return createResultError(op, "Missing invitation code", args.invitationCode)
  }

  const invitation = await ctx.db
    .query("orgInvitations")
    .withIndex("invitationCode", (q) => q.eq("invitationCode", args.invitationCode))
    .unique()

  if (!invitation) {
    return createResultError(op, "Invalid invitation code", args.invitationCode)
  }
  if (args.updatedAt === invitation.updatedAt) {
    return createResult(null)
  }
  return createResult(invitation)
}
