import type { JSX } from "solid-js"
import { For, Match, Switch } from "solid-js"
import { appIcons } from "#src/app/icon/appIcons.ts"
import { ttc } from "#src/app/i18n/ttc.ts"
import type { OrgModel } from "#src/org/org_model/OrgModel.ts"
import { urlOrgAdd, urlOrgView } from "#src/org/org_url/urlOrg.ts"
import { PageHeader } from "#src/ui/header/PageHeader.tsx"
import { NoData } from "#src/ui/illustrations/NoData.tsx"
import { ErrorPage } from "#src/ui/pages/ErrorPage.tsx"
import { LoadingSection } from "#src/ui/pages/LoadingSection.tsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"

export function OrgListView(p: {
  orgs?: OrgModel[]
  error?: string
  createHref?: string
  viewHref?: (orgHandle: string) => string
  pagination?: JSX.Element
}) {
  return (
    <>
      <PageHeader title={ttc("Organizations")} class="mb-4">
        <LinkButtonInternal icon={appIcons.create} to={p.createHref ?? urlOrgAdd()} variant={buttonVariant.filledGreen}>
          {ttc("Create Organization")}
        </LinkButtonInternal>
      </PageHeader>
      <Switch>
        <Match when={p.error}>{(message) => <ErrorPage title={message()} />}</Match>
        <Match when={p.orgs === undefined}>
          <LoadingSection loadingSubject={ttc("Organizations")} />
        </Match>
        <Match when={p.orgs?.length === 0}>
          <NoData noDataText={ttc("No Organizations")} />
        </Match>
        <Match when={p.orgs}>
          {(orgs) => (
            <>
              <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <For each={orgs()}>
                  {(org) => (
                    <LinkButtonInternal to={(p.viewHref ?? urlOrgView)(org.orgHandle)}>{org.name}</LinkButtonInternal>
                  )}
                </For>
              </div>
              {p.pagination}
            </>
          )}
        </Match>
      </Switch>
    </>
  )
}
