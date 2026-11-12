import { For, Show } from "solid-js"
import { appIcons } from "#src/app/icon/appIcons.ts"
import { ttc } from "#src/app/i18n/ttc.ts"
import type { OrgInvitationModel } from "#src/org/invitation_model/orgInvitationSchema.ts"
import type { OrgInvitationListPagination } from "#src/org/invitation_ui/list/OrgInvitationListSection.tsx"
import { OrgInvitationCard } from "#src/org/invitation_ui/view/OrgInvitationCard.tsx"
import { urlOrgInvitationAdd } from "#src/org/invitation_url/urlOrgInvitation.ts"
import { PageHeader } from "#src/ui/header/PageHeader.tsx"
import { NoData } from "#src/ui/illustrations/NoData.tsx"
import { PaginationControls } from "#src/ui/pagination/PaginationControls.tsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { Badge } from "#ui/static/badge/Badge.jsx"

interface OrgInvitationListViewProps {
  orgHandle: string
  invitations: OrgInvitationModel[]
  addHref?: string
  acceptHref?: (code: string) => string
  demo?: boolean
  pagination?: OrgInvitationListPagination
}

export function OrgInvitationListView(p: OrgInvitationListViewProps) {
  return (
    <>
      <PageHeader
        title={ttc("Organization Invitations")}
        subtitle={ttc("Manage invitations of this organization")}
        class="mb-4"
      >
        <LinkButtonInternal
          icon={appIcons.create}
          to={p.addHref ?? urlOrgInvitationAdd(p.orgHandle)}
          variant={buttonVariant.filledIndigo}
        >
          {ttc("Add Invitation")}
        </LinkButtonInternal>
      </PageHeader>
      <Show when={p.invitations.length > 0} fallback={<NoData noDataText={ttc("No Organization Invitations")} />}>
        <div class="mb-2 flex items-center gap-2">
          <h2 class="text-xs font-semibold text-muted-foreground">{ttc("Organization Invitations")}</h2>
          <Badge>{p.invitations.length}</Badge>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <For each={p.invitations}>
            {(invitation) => (
              <div>
                <OrgInvitationCard invitation={invitation} demo={p.demo} />
                <Show when={p.acceptHref}>
                  {(href) => (
                    <LinkButtonInternal to={href()(invitation.invitationCode)}>
                      {ttc("Accept Invitation")}
                    </LinkButtonInternal>
                  )}
                </Show>
              </div>
            )}
          </For>
        </div>
      </Show>
      <Show when={p.invitations.length > 0 && p.pagination}>
        {(pagination) => (
          <PaginationControls
            page={() => pagination().history().length + 1}
            canPrevious={pagination().canPrevious}
            canNext={pagination().canNext}
            previous={pagination().previous}
            next={pagination().next}
            loading={pagination().loading}
          />
        )}
      </Show>
    </>
  )
}
