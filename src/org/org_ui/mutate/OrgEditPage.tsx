import { useParams } from "@tanstack/solid-router"
import { Match, Switch } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import { NavLinkButton } from "#src/app/nav/links/NavLinkButton.tsx"
import { NavOrg } from "#src/app/nav/NavOrg.tsx"
import { OrgMutate } from "#src/org/org_ui/mutate/OrgMutate.tsx"
import { urlOrgEdit } from "#src/org/org_url/urlOrg.ts"
import { ErrorPage } from "#src/ui/pages/ErrorPage.tsx"
import { formMode, getFormModeTitle } from "#ui/input/form/formMode.ts"
import { PageWrapper } from "#ui/static/page/PageWrapper.jsx"

const mode = formMode.edit

export function OrgEditPage() {
  const params = useParams({ strict: false })
  const getOrgHandleParam = () => params().orgHandle
  return (
    <Switch>
      <Match when={!getOrgHandleParam()}>
        <ErrorPage title={ttc("Missing :orgHandle in path")} />
      </Match>
      <Match when={getOrgHandleParam()}>
        {(getOrgHandle) => (
          <PageWrapper>
            <NavOrg getOrgPageTitle={getPageTitle} orgHandle={getOrgHandle()}>
              <NavLinkButton href={urlOrgEdit(getOrgHandle())} isActive={true}>
                {ttc("Edit")}
              </NavLinkButton>
            </NavOrg>
            <OrgMutate mode={mode} orgHandle={getOrgHandle()} />
          </PageWrapper>
        )}
      </Match>
    </Switch>
  )
}

function getPageTitle(orgName?: string, orgNameAlt?: string) {
  return getFormModeTitle(mode, orgNameAlt ?? ttc("Organization"))
}
