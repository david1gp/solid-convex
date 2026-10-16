import { Show } from "solid-js"
import { appIcons } from "#src/app/icon/appIcons.ts"
import { NavBreadcrumbSeparator } from "#src/app/nav/NavBreadcrumbSeparator.tsx"
import { NavCrumbs } from "#src/app/nav/NavCrumbs.tsx"
import { NavLinkButton } from "#src/app/nav/links/NavLinkButton.tsx"
import { OrganizationListNavButton } from "#src/app/nav/links/OrganizationListNavButton.tsx"
import { teamHrefGet } from "#src/team/ui/teamHrefGet.ts"
import { TeamListSection } from "#src/team/ui/TeamListSection.tsx"
import { teamListPageStateCreate } from "#src/team/ui/teamListPageStateCreate.ts"
import { PageWrapper } from "#ui/static/page/PageWrapper.jsx"

export function TeamListPage() {
  const state = teamListPageStateCreate()
  return (
    <PageWrapper>
      <NavCrumbs class="px-4 pt-4">
        <OrganizationListNavButton isActive={false} />
        <Show when={state.orgHandle()}>
          {(orgHandle) => (
            <>
              <NavBreadcrumbSeparator />
              <NavLinkButton href={state.orgHref()} icon={appIcons.organization} isActive={false}>
                {orgHandle()}
              </NavLinkButton>
            </>
          )}
        </Show>
        <NavBreadcrumbSeparator />
        <NavLinkButton href={teamHrefGet("list", state.orgHandle())} icon={appIcons.team} isActive={true}>
          Teams
        </NavLinkButton>
      </NavCrumbs>
      <TeamListSection orgHandle={state.orgHandle()} />
    </PageWrapper>
  )
}
