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
        <LinkButtonInternal icon={appIcons.create} to={p.addHref} variant={buttonVariant.filledGreen}>
          {ttc("Add Member")}
        </LinkButtonInternal>
      </PageHeader>
      <Show when={!p.failed} fallback={<p>Fallback content</p>}>
        <Show when={p.members} fallback={<LoadingSection loadingSubject={ttc("Organization Members")} />}>
          {(members) => (
            <Show when={members().length > 0} fallback={<NoData noDataText={ttc("No Members")} />}>
              <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <For each={members()}>
                  {(member) => (
                    <Show when={p.viewHref} fallback={<span>{member.userId}</span>}>
                      {(viewHref) => (
                        <LinkButtonInternal to={viewHref()(member.memberId)}>{member.userId}</LinkButtonInternal>
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
