import { Show } from "solid-js"
import { appIcons } from "#src/app/icon/appIcons.ts"
import { NavBreadcrumbSeparator } from "#src/app/nav/NavBreadcrumbSeparator.tsx"
import { NavCrumbs } from "#src/app/nav/NavCrumbs.tsx"
import { NavLinkButton } from "#src/app/nav/links/NavLinkButton.tsx"
import { OrganizationListNavButton } from "#src/app/nav/links/OrganizationListNavButton.tsx"
import { projectHrefGet } from "#src/project/ui/projectHrefGet.ts"
import { ProjectListSection } from "#src/project/ui/ProjectListSection.tsx"
import { projectListPageStateCreate } from "#src/project/ui/projectListPageStateCreate.ts"
import { PageWrapper } from "#ui/static/page/PageWrapper.jsx"

export function ProjectListPage() {
  const state = projectListPageStateCreate()
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
        <Show when={state.teamId()}>
          {(teamId) => (
            <>
              <NavBreadcrumbSeparator />
              <NavLinkButton href={state.teamHref()} icon={appIcons.team} isActive={false}>
                Team
              </NavLinkButton>
            </>
          )}
        </Show>
        <NavBreadcrumbSeparator />
        <NavLinkButton
          href={projectHrefGet("list", { orgHandle: state.orgHandle(), teamId: state.teamId() })}
          icon={appIcons.project}
          isActive={true}
        >
          Projects
        </NavLinkButton>
      </NavCrumbs>
      <ProjectListSection orgHandle={state.orgHandle()} teamId={state.teamId()} />
    </PageWrapper>
  )
}
