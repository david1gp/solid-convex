import { Show, omit } from "solid-js"
import { NavLinkButton } from "#src/app/nav/links/NavLinkButton.tsx"
import { OrganizationListNavButton } from "#src/app/nav/links/OrganizationListNavButton.tsx"
import { NavBreadcrumbSeparator } from "#src/app/nav/NavBreadcrumbSeparator.tsx"
import { NavCrumbs } from "#src/app/nav/NavCrumbs.tsx"
import { orgNameGet } from "#src/org/org_ui/orgNameRecordSignal.ts"
import { urlOrgView } from "#src/org/org_url/urlOrg.ts"
import { SetPageTitle } from "#ui/static/meta/SetPageTitle.jsx"
import type { MayHaveChildren } from "#ui/utils/MayHaveChildren.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

export interface NavOrgProps extends NavOrgBreadcrumbsProps, MayHaveChildren, MayHaveClass {}

export function NavOrg(p: NavOrgProps) {
  const rest = omit(p, "children", "class")
  return (
    <NavCrumbs class={p.class}>
      <NavOrgBreadcrumbs {...rest}>{p.children}</NavOrgBreadcrumbs>
    </NavCrumbs>
  )
}

export interface NavOrgBreadcrumbsProps extends MayHaveChildren {
  orgHandle?: string
  getOrgPageTitle?: (orgName?: string) => string
}

function NavOrgBreadcrumbs(p: NavOrgBreadcrumbsProps) {
  return (
    <>
      <Show when={p.getOrgPageTitle}>
        {(getPageTitle) => <SetPageTitle title={getPageTitle()(p.orgHandle && orgNameGet(p.orgHandle))} />}
      </Show>
      {/* 1 */}
      <OrganizationListNavButton isActive={!p.orgHandle && !p.children} />
      {/* 2 */}
      <Show when={p.orgHandle && orgNameGet(p.orgHandle)}>
        {(orgName) => (
          <>
            <NavBreadcrumbSeparator />
            <NavLinkButton href={p.orgHandle ? urlOrgView(p.orgHandle) : ""} isActive={!p.children}>
              {orgName()}
            </NavLinkButton>
          </>
        )}
      </Show>
      {/* 3 */}
      <Show when={p.children}>
        {(getChildren) => (
          <>
            <NavBreadcrumbSeparator />
            {getChildren()}
          </>
        )}
      </Show>
    </>
  )
}
