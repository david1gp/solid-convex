import { mdiAccountMultiple } from "@adaptive-ds/mdi/mdiAccountMultiple.js"
import { type Accessor, For, Show } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import type { OrgMemberProfile } from "#src/org/member_model/OrgMemberProfile.ts"
import { OrgMemberCard } from "#src/org/member_ui/view/OrgMemberCard.tsx"
import type { HasOrgHandle } from "#src/org/org_model_field/HasOrgHandle.ts"
import { orgPageSection } from "#src/org/org_ui/view/orgPageSection.tsx"
import { SectionHeader } from "#src/ui/header/SectionHeader.tsx"
import { PaginationControls } from "#src/ui/pagination/PaginationControls.tsx"
import { cn } from "cn"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

export interface OrgMemberListProps extends HasOrgHandle, MayHaveClass {
  members: OrgMemberProfile[]
  pagination?: OrgMemberListPagination
  loading?: boolean
  demo?: boolean
}

export interface OrgMemberListPagination {
  history: Accessor<readonly (string | null)[]>
  canPrevious: Accessor<boolean>
  canNext: Accessor<boolean>
  previous: () => void
  next: () => void
  loading: Accessor<boolean>
}

export function OrgMemberListSection(p: OrgMemberListProps) {
  const showMemberActionsNotImplemented = false
  return (
    <section id={orgPageSection.members} class={cn("space-y-1", "my-2", p.class)}>
      <Header />
      <Show when={!p.loading} fallback={<p class="text-sm text-muted-foreground">{ttc("Loading members...")}</p>}>
        <Show when={p.members.length > 0} fallback={<NoOrgMembersText />}>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <For each={p.members}>
              {(member) => (
                <OrgMemberCard
                  showActions={showMemberActionsNotImplemented}
                  orgHandle={p.orgHandle}
                  member={member}
                  demo={p.demo}
                />
              )}
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

function Header() {
  return (
    <SectionHeader icon={mdiAccountMultiple} title={ttc("Organization Members")}>
      {/* <LinkButton href={urlOrgMemberAdd(p.org.orgHandle)} variant={buttonVariant.contrast} icon={formIcon.add}>
        {ttt("Add")}
      </LinkButton> */}
    </SectionHeader>
  )
}

function NoOrgMembersText() {
  return <p class="text-sm text-muted-foreground">{ttc("No members yet")}</p>
}
