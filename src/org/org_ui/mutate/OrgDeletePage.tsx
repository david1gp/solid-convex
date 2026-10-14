import { Match, Switch } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import { NavLinkButton } from "#src/app/nav/links/NavLinkButton.tsx"
import { NavOrg } from "#src/app/nav/NavOrg.tsx"
import { HierarchyDeleteView } from "#src/hierarchy_delete/ui/HierarchyDeleteView.tsx"
import { orgDeletePageStateCreate } from "#src/org/org_ui/mutate/orgDeletePageStateCreate.ts"
import { urlOrgRemove } from "#src/org/org_url/urlOrg.ts"
import { ErrorPage } from "#src/ui/pages/ErrorPage.tsx"
import { PageWrapper } from "#ui/static/page/PageWrapper.jsx"

export function OrgDeletePage() {
  const state = orgDeletePageStateCreate()

  return (
    <Switch>
      <Match when={!state.orgHandle()}>
        <ErrorPage title={ttc("Missing :orgHandle in path")} />
      </Match>
      <Match when={state.orgHandle()}>
        {(getOrgHandle) => (
          <PageWrapper>
            <NavOrg getOrgPageTitle={state.pageTitle} orgHandle={getOrgHandle()}>
              <NavLinkButton href={urlOrgRemove(getOrgHandle())} isActive={true}>
                {ttc("Delete")}
              </NavLinkButton>
            </NavOrg>
            <div class="px-2 sm:px-4 py-6">
              <HierarchyDeleteView target={state.target} onCancel={state.onCancel} onSuccess={state.onSuccess} />
            </div>
          </PageWrapper>
        )}
      </Match>
    </Switch>
  )
}
