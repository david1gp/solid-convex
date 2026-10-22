import type { DocOrgInvitation } from "#src/org/invitation_convex/IdOrgInvitation.ts"
import type { OrgInvitationModel } from "#src/org/invitation_model/orgInvitationSchema.ts"

export function docOrgInvitationToModel({ _id, _creationTime, ...rest }: DocOrgInvitation): OrgInvitationModel {
  return rest
}
