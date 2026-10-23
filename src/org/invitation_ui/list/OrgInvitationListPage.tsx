import { useParams } from "@tanstack/solid-router"
import { Match, Switch } from "solid-js"
import { api } from "#convex/_generated/api.js"
import type { Result } from "#result"
import { ttc } from "#src/app/i18n/ttc.ts"
import { LayoutWrapperApp } from "#src/app/layout/LayoutWrapperApp.tsx"
import { LinkLikeNavText } from "#src/app/nav/links/LinkLikeNavText.tsx"
import { NavOrg } from "#src/app/nav/NavOrg.tsx"
import { userSessionSignal, userTokenGet } from "#src/auth/ui/signals/userSessionSignal.ts"
import type { OrgInvitationModel } from "#src/org/invitation_model/orgInvitationSchema.ts"
import { orgInvitationSchema } from "#src/org/invitation_model/orgInvitationSchema.ts"
import { OrgInvitationListView } from "#src/org/invitation_ui/list/OrgInvitationListView.tsx"
import type { HasOrgHandle } from "#src/org/org_model_field/HasOrgHandle.ts"
import { ErrorPage } from "#src/ui/pages/ErrorPage.tsx"
import { LoadingSection } from "#src/ui/pages/LoadingSection.tsx"
import type { PaginationResultType } from "#src/utils/convex_backend/paginationResultType.ts"
import { cursorPaginationCreate } from "#src/utils/convex_client/cursorPaginationCreate.ts"
import { PageWrapper } from "#ui/static/page/PageWrapper.jsx"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

export function OrgInvitationListPage() {
  const params = useParams({ strict: false })
  const getOrgHandle = () => params().orgHandle
  return (
    <Switch>
      <Match when={!getOrgHandle()}>
        <ErrorPage title={ttc("Missing :orgHandle in path")} />
      </Match>
      <Match when={getOrgHandle()}>{(getHandle) => <ListPage orgHandle={getHandle()} />}</Match>
    </Switch>
  )
}

interface ListPageProps extends HasOrgHandle, MayHaveClass {}

function ListPage(p: ListPageProps) {
  return (
    <LayoutWrapperApp>
      <PageWrapper>
        <NavOrg getOrgPageTitle={getPageTitle} orgHandle={p.orgHandle}>
          <LinkLikeNavText>{ttc("Invitations")}</LinkLikeNavText>
        </NavOrg>
        <OrgInvitationListLoader orgHandle={p.orgHandle} />
      </PageWrapper>
    </LayoutWrapperApp>
  )
}

function getPageTitle(orgName?: string) {
  const name = orgName ?? ttc("Organization")
  return `${name} ${ttc("Invitations")}`
}

interface OrgInvitationListLoaderProps extends HasOrgHandle {}

function OrgInvitationListLoader(p: OrgInvitationListLoaderProps) {
  const pagination = cursorPaginationCreate({
    query: api.org.orgInvitationsListQuery,
    queryKey: "orgInvitationsListQuery",
    args: () => ({ token: userTokenGet(), orgHandle: p.orgHandle }),
    identity: () => userSessionSignal.get()?.profile.userId ?? null,
    scope: () => p.orgHandle,
    itemSchema: orgInvitationSchema,
  })

  return (
    <Switch fallback={<p>Fallback content</p>}>
      <Match when={pagination.page() === undefined}>
        <OrgInvitationLoading />
      </Match>
      <Match when={getOrgInvitationsPage(pagination.page())}>
        {(getPage) => (
          <OrgInvitationListView orgHandle={p.orgHandle} invitations={getPage().page} pagination={pagination} />
        )}
      </Match>
    </Switch>
  )
}

function getOrgInvitationsPage(
  orgInvitationsResult: Result<PaginationResultType<OrgInvitationModel>> | undefined,
): PaginationResultType<OrgInvitationModel> | null {
  if (!orgInvitationsResult?.success) return null
  return orgInvitationsResult.data
}

function OrgInvitationLoading() {
  return <LoadingSection loadingSubject={ttc("Organization Invitations")} />
}
