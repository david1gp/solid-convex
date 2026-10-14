import { useParams } from "@tanstack/solid-router"
import { Match, Switch } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import { NavLinkButton } from "#src/app/nav/links/NavLinkButton.tsx"
import { NavOrg } from "#src/app/nav/NavOrg.tsx"
import { OrgMemberMutate } from "#src/org/member_ui/mutate/OrgMemberMutate.tsx"
import { urlOrgMemberEdit } from "#src/org/member_url/urlOrgMember.ts"
import { ErrorPage } from "#src/ui/pages/ErrorPage.tsx"
import { formMode, getFormModeTitle } from "#ui/input/form/formMode.ts"
import { PageWrapper } from "#ui/static/page/PageWrapper.jsx"

const mode = formMode.edit

export function OrgMemberEditPage() {
  const params = useParams({ strict: false })
  const getOrgHandle = () => params().orgHandle
  const getMemberId = () => params().memberId
  return (
    <Switch>
      <Match when={!getOrgHandle()}>
        <ErrorPage title={ttc("Missing :orgHandle in path")} />
      </Match>
      <Match when={!getMemberId()}>
        <ErrorPage title={ttc("Missing :memberId in path")} />
      </Match>
      <Match when={getMemberId()}>
        <PageWrapper>
          <NavOrg getOrgPageTitle={getPageTitle} orgHandle={getOrgHandle()}>
            <NavLinkButton href={urlOrgMemberEdit(getOrgHandle()!, getMemberId()!)} isActive={true}>
              {ttc("Edit Member")}
            </NavLinkButton>
          </NavOrg>
          <OrgMemberMutate mode={mode} orgHandle={getOrgHandle()!} memberId={getMemberId()!} />
        </PageWrapper>
      </Match>
    </Switch>
  )
}

function getPageTitle() {
  return getFormModeTitle(mode, ttc("Organization Member"))
}
