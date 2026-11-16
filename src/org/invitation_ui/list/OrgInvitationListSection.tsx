import { mdiEmail } from "@adaptive-ds/mdi/mdiEmail.js"
import { type Accessor, For, Show, splitProps } from "solid-js"
import { appIcons } from "#src/app/icon/appIcons.ts"
import { ttc } from "#src/app/i18n/ttc.ts"
import type { OrgInvitationModel } from "#src/org/invitation_model/orgInvitationSchema.ts"
import { OrgInvitationCard } from "#src/org/invitation_ui/view/OrgInvitationCard.tsx"
import { urlOrgInvitationAdd } from "#src/org/invitation_url/urlOrgInvitation.ts"
import type { HasOrgHandle } from "#src/org/org_model_field/HasOrgHandle.ts"
import { orgPageSection } from "#src/org/org_ui/view/orgPageSection.tsx"
import { SectionHeader } from "#src/ui/header/SectionHeader.tsx"
import { PaginationControls } from "#src/ui/pagination/PaginationControls.tsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { cn } from "cn"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

export interface OrgInvitationsProps extends HasOrgHandle, MayHaveClass {
  invitations: OrgInvitationModel[]
  pagination?: OrgInvitationListPagination
  loading?: boolean
  addHref?: string
  demo?: boolean
}

export interface OrgInvitationListPagination {
  history: Accessor<readonly (string | null)[]>
  canPrevious: Accessor<boolean>
  canNext: Accessor<boolean>
  previous: () => void
  next: () => void
  loading: Accessor<boolean>
}

export function OrgInvitationListSection(p: OrgInvitationsProps) {
  const [s, rest] = splitProps(p, ["class", "pagination", "loading"])
  return (
    <section id={orgPageSection.invitations} class={cn("space-y-1", "my-2", s.class)}>
      <Header {...rest} />
      <Show when={!p.loading} fallback={<p class="text-sm text-muted-foreground">{ttc("Loading invitations...")}</p>}>
        <Show when={p.invitations.length > 0} fallback={<NoOrgInvitationsText />}>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <For each={p.invitations}>
              {(invitation) => <OrgInvitationCard invitation={invitation} demo={p.demo} />}
            </For>
          </div>
        </Show>
      </Show>
      <Show when={p.pagination}>
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
    </section>
  )
}

function NoOrgInvitationsText() {
  return <p class="text-sm text-muted-foreground">{ttc("No invitations yet")}</p>
}

function Header(p: OrgInvitationsProps) {
  return (
    <SectionHeader icon={mdiEmail} to={p.addHref ?? urlOrgInvitationAdd(p.orgHandle)} title={ttc("Member Invitations")}>
      <LinkButtonInternal
        to={p.addHref ?? urlOrgInvitationAdd(p.orgHandle)}
        variant={buttonVariant.subtle}
        icon={appIcons.create}
        class="hover:bg-hover"
      >
        {ttc("Invite Member")}
      </LinkButtonInternal>
    </SectionHeader>
  )
}
