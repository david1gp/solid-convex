import { v } from "convex/values"
import * as a from "valibot"
import { internal } from "#convex/_generated/api.js"
import type { ActionCtx } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import { envBaseUrlAppResult } from "#src/app/env/public/envBaseUrlAppResult.ts"
import { languageSchema } from "#src/app/i18n/language.ts"
import {
  type GenerateEmailOrgInvitationProps,
  sendEmailOrgInvitation,
} from "#src/auth/convex/email/sendEmailOrgInvitation.ts"
import type { OrgInvitationDataModel } from "#src/org/invitation_model/OrgInvitationModel.ts"
import { orgInvitationDataSchemaFields } from "#src/org/invitation_model/orgInvitationSchema.ts"
import { urlOrgInvitationAccept } from "#src/org/invitation_url/urlOrgInvitation.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { nowIso } from "#utils/date/nowIso.js"

export type OrgInvitationSendEmailValidatorType = typeof orgInvitationSendEmailValidator.type

export const orgInvitationSendEmailFields = valibotToConvex({
  // token: v.string(),
  // id
  orgHandle: a.string(),
  // data
  invitationCode: a.string(),
  // invite
  invitedName: a.string(),
  invitedEmail: a.string(),
  l: languageSchema,
  // by
  invitedByName: a.string(),
  invitedByEmail: a.string(),
  // org
  orgName: a.string(),
  role: orgInvitationDataSchemaFields.role,
})

export const orgInvitationSendEmailValidator = v.object(orgInvitationSendEmailFields)

export async function orgInvitation32SendEmailActionFn(
  ctx: ActionCtx,
  args: OrgInvitationSendEmailValidatorType,
): PromiseResult<null> {
  const op = "orgInvitation32SendEmailActionFn"
  const baseUrlAppResult = envBaseUrlAppResult()
  if (!baseUrlAppResult.success) {
    return baseUrlAppResult
  }
  const baseUrlApp = baseUrlAppResult.data

  const emailProps: GenerateEmailOrgInvitationProps = {
    // invite
    invitedName: args.invitedName,
    // by
    invitedByName: args.invitedByName,
    invitedByEmail: args.invitedByEmail,
    l: args.l,
    // data
    orgName: args.orgName,
    url: baseUrlApp + urlOrgInvitationAccept(args.orgHandle, args.invitationCode),
  }
  const emailResult = await sendEmailOrgInvitation(args.invitedEmail, emailProps)
  if (!emailResult.success) {
    console.error("Failed to send invitation email", emailResult)
    return emailResult
  }

  const invitationResult = await ctx.runQuery(internal.org.orgInvitationGetInternalQuery, {
    invitationCode: args.invitationCode,
  })
  if (!invitationResult.success) {
    return invitationResult
  }
  const invitation = invitationResult.data
  if (!invitation) {
    return createResultError(op, "!invitation")
  }

  const now = nowIso()
  const update: Partial<OrgInvitationDataModel> = {
    emailSendAt: now,
    emailSendAmount: invitation.emailSendAmount + 1,
  }
  const update2 = {
    _id: invitation._id,
    ...update,
  } as const

  const updateResult = await ctx.runMutation(internal.org.orgInvitation33UpdateInternalMutation, update2)

  return createResult(null)
}
