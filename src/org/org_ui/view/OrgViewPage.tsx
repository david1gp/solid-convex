import { useParams } from "@tanstack/solid-router"
import { Match, Switch } from "solid-js"
import type { Result, ResultErr } from "#result"
import { ttc } from "#src/app/i18n/ttc.ts"
import { NavOrg } from "#src/app/nav/NavOrg.tsx"
import type { OrgViewPageType } from "#src/org/org_model/OrgViewPageType.ts"
import type { HasOrgHandle } from "#src/org/org_model_field/HasOrgHandle.ts"
import { OrgViewContent } from "#src/org/org_ui/view/OrgViewContent.tsx"
import { orgViewPageStateCreate } from "#src/org/org_ui/view/orgViewPageStateCreate.ts"
import { ErrorPage } from "#src/ui/pages/ErrorPage.tsx"
import type { PaginationResultType } from "#src/utils/convex_backend/paginationResultType.ts"
import { PageWrapper } from "#ui/static/page/PageWrapper.jsx"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

export function OrgViewPage() {
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
            <NavOrg getOrgPageTitle={getPageTitle} orgHandle={getOrgHandle()} />
            <OrgViewLoader orgHandle={getOrgHandle()} />
          </PageWrapper>
        )}
      </Match>
    </Switch>
  )
}

function getPageTitle(orgName?: string) {
  return orgName ?? ttc("Organization")
}

interface OrgViewLoaderProps extends HasOrgHandle, MayHaveClass {}

function OrgViewLoader(p: OrgViewLoaderProps) {
  const { getDataResult, membersPagination, invitationsPagination } = orgViewPageStateCreate(() => p.orgHandle)

  return (
    <Switch>
      <Match when={!getDataResult()}>
        <ErrorPage title="Error loading organization" />
      </Match>
      <Match when={!getDataResult()!.success}>
        <ErrorPage title={(getDataResult()! as ResultErr).errorMessage || "Error loading organization"} />
      </Match>
      <Match when={getData(getDataResult)}>
        {(gotData) => (
          <OrgViewContent
            org={gotData().data.org}
            members={getPaginationPage(membersPagination.page())?.page ?? []}
            invitations={getPaginationPage(invitationsPagination.page())?.page ?? []}
            membersPagination={membersPagination}
            invitationsPagination={invitationsPagination}
            membersLoading={membersPagination.loading()}
            invitationsLoading={invitationsPagination.loading()}
          />
        )}
      </Match>
    </Switch>
  )
}

function getData(getDataResult: () => Result<OrgViewPageType> | undefined): { data: OrgViewPageType } | null {
  const result = getDataResult()
  if (!result?.success) return null
  return { data: result.data }
}

function getPaginationPage<T>(result: Result<PaginationResultType<T>> | undefined): PaginationResultType<T> | null {
  if (!result?.success) return null
  return result.data
}
