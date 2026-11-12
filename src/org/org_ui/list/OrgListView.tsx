import type { JSX } from "solid-js"
import { For, Match, Switch } from "solid-js"
import { Link } from "@tanstack/solid-router"
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
import { Badge } from "#ui/static/badge/Badge.jsx"

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
        <LinkButtonInternal
          icon={appIcons.create}
          to={p.createHref ?? urlOrgAdd()}
          variant={buttonVariant.filledIndigo}
        >
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
              <div class="mb-2 flex items-center gap-2">
                <h2 class="text-xs font-semibold text-muted-foreground">{ttc("Organizations")}</h2>
                <Badge>{orgs().length}</Badge>
              </div>
              <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <For each={orgs()}>
                  {(org) => (
                    <Link
                      to={(p.viewHref ?? urlOrgView)(org.orgHandle)}
                      class="focus-ring rounded-md border border-border bg-background p-4 text-sm font-semibold hover:bg-hover"
                    >
                      {org.name}
                    </Link>
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
