import type { OrgInvitationModel } from "#src/org/invitation_model/OrgInvitationModel.ts"
import { OrgInvitationListSection } from "#src/org/invitation_ui/list/OrgInvitationListSection.tsx"
import type { OrgMemberProfile } from "#src/org/member_model/OrgMemberProfile.ts"
import { OrgMemberListSection } from "#src/org/member_ui/list/OrgMemberListSection.tsx"
import type { OrgModel } from "#src/org/org_model/OrgModel.ts"
import { OrgViewInformation } from "#src/org/org_ui/view/OrgViewInformation.tsx"
import { Show } from "solid-js"
import { TeamListSection } from "#src/team/ui/TeamListSection.tsx"

export function OrgViewContent(p: {
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
}) {
  return (
    <>
      <OrgViewInformation showEditButton={true} org={p.org} editHref={p.editHref} />
      <Show when={!p.demo}>
        <TeamListSection orgHandle={p.org.orgHandle} />
      </Show>
      <OrgMemberListSection
        orgHandle={p.org.orgHandle}
        members={p.members}
        demo={p.demo}
        pagination={p.membersPagination}
        loading={p.membersLoading}
      />
      <OrgInvitationListSection
        orgHandle={p.org.orgHandle}
        invitations={p.invitations}
        pagination={p.invitationsPagination}
        loading={p.invitationsLoading}
        addHref={p.invitationAddHref}
        demo={p.demo}
      />
    </>
  )
}
