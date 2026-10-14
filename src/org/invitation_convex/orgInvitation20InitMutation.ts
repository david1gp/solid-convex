import { v } from "convex/values"
import * as a from "valibot"
import { internal } from "#convex/_generated/api.js"
import { type MutationCtx, mutation } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import { languageSchema } from "#src/app/i18n/language.ts"
import { findUserByEmailFn } from "#src/auth/convex/crud/findUserByEmailQuery.ts"
import { orgInvitation21CreateMutationFn } from "#src/org/invitation_convex/orgInvitation21CreateInternalMutation.ts"
import { orgInvitationDataSchemaFields } from "#src/org/invitation_model/orgInvitationSchema.ts"
import { orgMemberGetByUserIdFn } from "#src/org/member_convex/orgMemberGetByUserIdFn.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authCredentialResolve } from "#src/utils/convex_backend/authCredentialResolve.ts"
import { generateId12 } from "#utils/ran/generateId12.js"

export type OrgInvitationCreateValidatorType = typeof orgInvitationCreateActionValidator.type

export const orgInvitationInitMutationFields = valibotToConvex({
  token: a.string(),
  orgHandle: orgInvitationDataSchemaFields.orgHandle,
  invitedName: orgInvitationDataSchemaFields.invitedName,
  invitedEmail: orgInvitationDataSchemaFields.invitedEmail,
  l: languageSchema,
  role: orgInvitationDataSchemaFields.role,
})

export const orgInvitationCreateActionValidator = v.object(orgInvitationInitMutationFields)

export const orgInvitation20InitMutation = mutation({
  args: orgInvitationCreateActionValidator,
  handler: orgInvitation20InitMutationFn,
})

export async function orgInvitation20InitMutationFn(
  ctx: MutationCtx,
  args: OrgInvitationCreateValidatorType,
): PromiseResult<string> {
  const op = "orgInvitation20InitMutationFn"

  const credentialResult = await authCredentialResolve(ctx, args.token)
  if (!credentialResult.success) {
    console.info(credentialResult)
    return credentialResult
  }
  const invitedBy = credentialResult.data.userId

  const org = await ctx.db
    .query("orgs")
    .withIndex("orgHandle", (q) => q.eq("orgHandle", args.orgHandle))
    .unique()
  if (!org) {
    return createResultError(op, "Organization not found", args.orgHandle)
  }
  if (org.deleting) {
    return createResultError(op, "Organization is currently being deleted")
  }

  // Check if invitation already exists and not accepted
  const existingInvitation = await ctx.db
    .query("orgInvitations")
    .withIndex("invitedEmail", (q) => q.eq("invitedEmail", args.invitedEmail))
    .first()

  // Check if already in org
  const invitedUser = await findUserByEmailFn(ctx, args.invitedEmail)
  if (invitedUser) {
    const existingMember = await orgMemberGetByUserIdFn(ctx, invitedUser._id)
    if (existingMember && existingMember.orgHandle === args.orgHandle) {
      return createResultError(op, "User is already a member of this organization", args.invitedEmail)
    }
  }

  const invitationCode = generateId12()

  // init/create invitation
  await orgInvitation21CreateMutationFn(ctx, {
    invitationCode: invitationCode,
    invitedBy: invitedBy,
    invitedName: args.invitedName,
    invitedEmail: args.invitedEmail,
    l: args.l,
    orgHandle: args.orgHandle,
    role: args.role,
  })

  // shedule email sending
  await ctx.scheduler.runAfter(0, internal.org.orgInvitation31SendInternalAction, { token: args.token, invitationCode })

  return createResult(invitationCode)
}
