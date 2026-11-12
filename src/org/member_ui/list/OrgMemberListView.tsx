import { Link } from "@tanstack/solid-router"
import { For, Show } from "solid-js"
import { appIcons } from "#src/app/icon/appIcons.ts"
import { ttc } from "#src/app/i18n/ttc.ts"
import type { OrgMemberProfile } from "#src/org/member_model/OrgMemberProfile.ts"
import { PageHeader } from "#src/ui/header/PageHeader.tsx"
import { NoData } from "#src/ui/illustrations/NoData.tsx"
import { LoadingSection } from "#src/ui/pages/LoadingSection.tsx"
import { PaginationControls } from "#src/ui/pagination/PaginationControls.tsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { Badge } from "#ui/static/badge/Badge.jsx"

const classesMemberCard = "rounded-md border border-border bg-background p-4 text-sm font-semibold hover:bg-hover"

export function OrgMemberListView(p: {
  members: OrgMemberProfile[] | undefined
  failed?: boolean
  addHref: string
  viewHref?: (memberId: string) => string
  pagination?: {
    page: () => number
    canPrevious: () => boolean
    canNext: () => boolean
    previous: () => void
    next: () => void
    loading: () => boolean
  }
}) {
  return (
    <>
      <PageHeader
        icon={appIcons.member}
        title={ttc("Organization Members")}
        subtitle={ttc("Manage members of this organization")}
        class="mb-4"
      >
        <LinkButtonInternal icon={appIcons.create} to={p.addHref} variant={buttonVariant.filledIndigo}>
          {ttc("Add Member")}
        </LinkButtonInternal>
      </PageHeader>
      <Show when={!p.failed} fallback={<p class="text-sm text-muted-foreground">Fallback content</p>}>
        <Show when={p.members} fallback={<LoadingSection loadingSubject={ttc("Organization Members")} />}>
          {(members) => (
            <Show when={members().length > 0} fallback={<NoData noDataText={ttc("No Members")} />}>
              <div class="mb-2 flex items-center gap-2">
                <h2 class="text-xs font-semibold text-muted-foreground">{ttc("Organization Members")}</h2>
                <Badge>{members().length}</Badge>
              </div>
              <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <For each={members()}>
                  {(member) => (
                    <Show when={p.viewHref} fallback={<span class={classesMemberCard}>{member.userId}</span>}>
                      {(viewHref) => (
                        <Link to={viewHref()(member.memberId)} class={`focus-ring ${classesMemberCard}`}>
                          {member.userId}
                        </Link>
                      )}
                    </Show>
                  )}
                </For>
              </div>
            </Show>
          )}
        </Show>
      </Show>
      <Show when={p.members?.length ? p.pagination : undefined}>
        {(pagination) => (
          <PaginationControls
            page={pagination().page}
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
