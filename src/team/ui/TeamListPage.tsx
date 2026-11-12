import { Show } from "solid-js"
import { pageDemoHref } from "#src/app/demos/pageDemoHref.ts"
import { appIcons } from "#src/app/icon/appIcons.ts"
import { NavBreadcrumbSeparator } from "#src/app/nav/NavBreadcrumbSeparator.tsx"
import { NavCrumbs } from "#src/app/nav/NavCrumbs.tsx"
import { NavLinkButton } from "#src/app/nav/links/NavLinkButton.tsx"
import { OrganizationListNavButton } from "#src/app/nav/links/OrganizationListNavButton.tsx"
import { teamHrefGet } from "#src/team/ui/teamHrefGet.ts"
import { TeamListSection } from "#src/team/ui/TeamListSection.tsx"
import { teamListSectionStateCreate } from "#src/team/ui/teamListSectionStateCreate.ts"
import { teamListPageStateCreate } from "#src/team/ui/teamListPageStateCreate.ts"
import { PageWrapper } from "#ui/static/page/PageWrapper.jsx"

export function TeamListPage(p: { demo?: { section: ReturnType<typeof teamListSectionStateCreate> } }) {
  const state = teamListPageStateCreate()
  const orgHref = () => {
    const orgHandle = state.orgHandle()
    if (!p.demo) return state.orgHref()
    return orgHandle ? pageDemoHref("/org/:orgHandle", { orgHandle }) : pageDemoHref("/org")
  }
  const listHref = () => {
    const orgHandle = state.orgHandle()
    if (!p.demo) return teamHrefGet("list", orgHandle)
    return orgHandle ? pageDemoHref("/org/:orgHandle/team", { orgHandle }) : pageDemoHref("/team")
  }
  return (
    <PageWrapper>
      <NavCrumbs class="px-4 pt-4">
        <OrganizationListNavButton isActive={false} />
        <Show when={state.orgHandle()}>
          {(orgHandle) => (
            <>
              <NavBreadcrumbSeparator />
              <NavLinkButton href={orgHref()} icon={appIcons.organization} isActive={false}>
                {orgHandle()}
              </NavLinkButton>
            </>
          )}
        </Show>
        <NavBreadcrumbSeparator />
        <NavLinkButton href={listHref()} icon={appIcons.team} isActive={true}>
          Teams
        </NavLinkButton>
      </NavCrumbs>
      <TeamListSection orgHandle={state.orgHandle()} demoState={p.demo?.section} />
    </PageWrapper>
  )
}
