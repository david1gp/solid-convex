import type { OrgInvitationModel } from "#src/org/invitation_model/orgInvitationSchema.ts"

/** Pure demo update: no email dispatch or backend mutation. */
export function orgInvitationDemoAdd(
  invitations: OrgInvitationModel[],
  orgHandle: string,
  data: Pick<OrgInvitationModel, "invitedName" | "invitedEmail" | "l" | "role">,
) {
  const nextCode = `invite-${Math.max(1, ...invitations.map((item) => Number(item.invitationCode.match(/^invite-(\d+)$/)?.[1] ?? 0))) + 1}`
  const date = "2026-09-28T09:00:00.000Z"
  const invitation: OrgInvitationModel = {
    ...data,
    orgHandle,
    invitationCode: nextCode,
    invitedBy: "demo-admin",
    emailSendAmount: 0,
    createdAt: date,
    updatedAt: date,
  }
  return [...invitations, invitation]
}
