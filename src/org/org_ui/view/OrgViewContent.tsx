import { Match, Switch } from "solid-js"
import { OrgInvitationListSection } from "#src/org/invitation_ui/list/OrgInvitationListSection.tsx"
import { OrgMemberListSection } from "#src/org/member_ui/list/OrgMemberListSection.tsx"
import type { OrgViewContentProps } from "#src/org/org_ui/view/OrgViewContentProps.ts"
import { OrgViewInformation } from "#src/org/org_ui/view/OrgViewInformation.tsx"
import { orgViewContentStateCreate } from "#src/org/org_ui/view/orgViewContentStateCreate.ts"
import { TeamListSection } from "#src/team/ui/TeamListSection.tsx"
import { TabsTop } from "#ui/interactive/tabs/TabsTop.tsx"

export function OrgViewContent(p: OrgViewContentProps) {
  const state = orgViewContentStateCreate(() => p)

  return (
    <TabsTop
      valueSignal={state.selectedTab}
      getOptions={state.tabOptions}
      valueText={state.tabText}
      valueIcon={state.tabIcon}
      valueAmount={state.tabAmount}
      class="mb-6 rounded-md p-1"
      valueChildren={(tab) => (
        <Switch>
          <Match when={tab === "overview"}>
            <OrgViewInformation showEditButton={true} org={p.org} editHref={p.editHref} />
          </Match>
          <Match when={tab === "teams" && !p.demo}>
            <TeamListSection orgHandle={p.org.orgHandle} />
          </Match>
          <Match when={tab === "members"}>
            <OrgMemberListSection
              orgHandle={p.org.orgHandle}
              members={p.members}
              demo={p.demo}
              pagination={p.membersPagination}
              loading={p.membersLoading}
            />
          </Match>
          <Match when={tab === "invitations"}>
            <OrgInvitationListSection
              orgHandle={p.org.orgHandle}
              invitations={p.invitations}
              pagination={p.invitationsPagination}
              loading={p.invitationsLoading}
              addHref={p.invitationAddHref}
              demo={p.demo}
            />
          </Match>
        </Switch>
      )}
    />
  )
}
