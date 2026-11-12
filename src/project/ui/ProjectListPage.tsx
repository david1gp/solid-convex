import { Show } from "solid-js"
import { pageDemoHref } from "#src/app/demos/pageDemoHref.ts"
import { appIcons } from "#src/app/icon/appIcons.ts"
import { NavBreadcrumbSeparator } from "#src/app/nav/NavBreadcrumbSeparator.tsx"
import { NavCrumbs } from "#src/app/nav/NavCrumbs.tsx"
import { NavLinkButton } from "#src/app/nav/links/NavLinkButton.tsx"
import { OrganizationListNavButton } from "#src/app/nav/links/OrganizationListNavButton.tsx"
import { projectHrefGet } from "#src/project/ui/projectHrefGet.ts"
import { ProjectListSection } from "#src/project/ui/ProjectListSection.tsx"
import { projectListPageStateCreate } from "#src/project/ui/projectListPageStateCreate.ts"
import { projectListSectionStateCreate } from "#src/project/ui/projectListSectionStateCreate.ts"
import { PageWrapper } from "#ui/static/page/PageWrapper.jsx"

export function ProjectListPage(p: { demo?: { section: ReturnType<typeof projectListSectionStateCreate> } }) {
  const state = projectListPageStateCreate()
  const orgHref = () => {
    const orgHandle = state.orgHandle()
    if (!p.demo) return state.orgHref()
    return orgHandle ? pageDemoHref("/org/:orgHandle", { orgHandle }) : pageDemoHref("/org")
  }
  const teamHref = () => {
    const orgHandle = state.orgHandle()
    const teamId = state.teamId()
    if (!p.demo) return state.teamHref()
    if (!teamId) return pageDemoHref("/team")
    return orgHandle
      ? pageDemoHref("/org/:orgHandle/team/:teamId", { orgHandle, teamId })
      : pageDemoHref("/team/:teamId", { teamId })
  }
  const listHref = () => {
    const orgHandle = state.orgHandle()
    const teamId = state.teamId()
    if (!p.demo) return projectHrefGet("list", { orgHandle, teamId })
    if (orgHandle && teamId) return pageDemoHref("/org/:orgHandle/team/:teamId/project", { orgHandle, teamId })
    if (teamId) return pageDemoHref("/team/:teamId/project", { teamId })
    if (orgHandle) return pageDemoHref("/org/:orgHandle/project", { orgHandle })
    return pageDemoHref("/project")
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
        <Show when={state.teamId()}>
          {(teamId) => (
            <>
              <NavBreadcrumbSeparator />
              <NavLinkButton href={teamHref()} icon={appIcons.team} isActive={false}>
                Team
              </NavLinkButton>
            </>
          )}
        </Show>
        <NavBreadcrumbSeparator />
        <NavLinkButton href={listHref()} icon={appIcons.project} isActive={true}>
          Projects
        </NavLinkButton>
      </NavCrumbs>
      <ProjectListSection orgHandle={state.orgHandle()} teamId={state.teamId()} demoState={p.demo?.section} />
    </PageWrapper>
  )
}
