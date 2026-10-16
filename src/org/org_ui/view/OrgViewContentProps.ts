import type { OrgInvitationModel } from "#src/org/invitation_model/OrgInvitationModel.ts"
import type { OrgInvitationListSection } from "#src/org/invitation_ui/list/OrgInvitationListSection.tsx"
import type { OrgMemberProfile } from "#src/org/member_model/OrgMemberProfile.ts"
import type { OrgMemberListSection } from "#src/org/member_ui/list/OrgMemberListSection.tsx"
import type { OrgModel } from "#src/org/org_model/OrgModel.ts"

export interface OrgViewContentProps {
  org: OrgModel
  members: OrgMemberProfile[]
  invitations: OrgInvitationModel[]
  membersPagination?: Parameters<typeof OrgMemberListSection>[0]["pagination"]
  invitationsPagination?: Parameters<typeof OrgInvitationListSection>[0]["pagination"]
  membersLoading?: boolean
  invitationsLoading?: boolean
  editHref?: string
  invitationAddHref?: string
  demo?: boolean
}
