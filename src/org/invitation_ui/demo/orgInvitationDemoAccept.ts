import type { OrgInvitationModel } from "#src/org/invitation_model/orgInvitationSchema.ts"

/** Mark an invitation accepted in local fixtures by removing it from the pending list. */
export function orgInvitationDemoAccept(invitations: OrgInvitationModel[], code: string) {
  return invitations.filter((invitation) => invitation.invitationCode !== code)
}
