import { mdiPlus } from "@adaptive-ds/mdi/mdiPlus.js"
import { createEffect, For, Match, Switch } from "solid-js"
import type { Result } from "#result"
import { pageDemoHref } from "#src/app/demos/pageDemoHref.ts"
import { ttc } from "#src/app/i18n/ttc.ts"
import { NavResource } from "#src/app/nav/NavResource.tsx"
import type { ResourceModel } from "#src/resource/model/ResourceModel.ts"
import { resourceFilterFields } from "#src/resource/model_field/resourceFilterFields.ts"
import { resourceListLoaderStateCreate } from "#src/resource/ui/list/resourceListLoaderStateCreate.ts"
import { resourceNameAddList } from "#src/resource/ui/resourceNameRecordSignal.ts"
import { ResourceCardLink } from "#src/resource/ui/shared/ResourceCardLink.tsx"
import { urlResourceAdd } from "#src/resource/url/urlResource.ts"
import { NoData } from "#src/ui/illustrations/NoData.tsx"
import { SearchFilterButtons } from "#src/ui/input/search/SearchFilterButtons.tsx"
import { SearchFilterPopover } from "#src/ui/input/search/SearchFilterPopover.tsx"
import { SearchInput } from "#src/ui/input/search/SearchInput.tsx"
import { ErrorPage } from "#src/ui/pages/ErrorPage.tsx"
import { LoadingSection } from "#src/ui/pages/LoadingSection.tsx"
import { PaginationControls } from "#src/ui/pagination/PaginationControls.tsx"
import type { PaginationResultType } from "#src/utils/convex_backend/paginationResultType.ts"
import { resultHasErrorMessage } from "#src/utils/result/resultHasErrorMessage.ts"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { classesGridCols2xl } from "#ui/static/grid/classesGridCols2xl.ts"
import { PageWrapper } from "#ui/static/page/PageWrapper.jsx"
import { classArr } from "#ui/utils/classArr.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"
import type { MayHaveClassAndChildren } from "#ui/utils/MayHaveClassAndChildren.ts"

export function ResourceListPage(p: { demo?: { resources: () => ResourceModel[] } }) {
  return (
    <PageWrapper>
      {!p.demo && <NavResource getResourcePageTitle={() => ttc("Resources")} />}
      <ResourceListLoader demo={p.demo} />
    </PageWrapper>
  )
}

function ResourceListLoader(p: { demo?: { resources: () => ResourceModel[] } }) {
  const state = resourceListLoaderStateCreate(() => p.demo)

  return (
    <>
      <div class="flex flex-wrap gap-2 justify-between mb-4">
        <div class="flex flex-wrap gap-2 items-center">
          <SearchInput searchSignal={state.searchState.searchSignal} searchState={state.searchState} />
          <SearchFilterPopover filterSignal={state.searchState.filterSignal} filterFields={resourceFilterFields} />
          <SearchFilterButtons filterSignal={state.searchState.filterSignal} filterFields={resourceFilterFields} />
        </div>
        <ResourceCreateLink demo={!!p.demo} />
      </div>

      {p.demo ? (
        <ResourceList resources={state.demoResources()} demo />
      ) : (
        <Switch>
          <Match when={state.pagination?.page() === undefined}>
            <LoadingSection loadingSubject={ttc("Resources")} />
          </Match>
          <Match when={resultHasErrorMessage(state.pagination?.page())}>
            {(errorMessage) => <ErrorPage title={errorMessage()} />}
          </Match>
          <Match when={resultHasNoResources(state.pagination?.page(), state.pagination!.canPrevious())}>
            <NoResources />
          </Match>
          <Match when={getResourcesPage(state.pagination?.page())}>
            {(getPage) => (
              <>
                <ResourceList resources={getPage().page} />
                <PaginationControls
                  page={() => state.pagination!.history().length + 1}
                  canPrevious={state.pagination!.canPrevious}
                  canNext={state.pagination!.canNext}
                  previous={state.pagination!.previous}
                  next={state.pagination!.next}
                  loading={state.pagination!.loading}
                />
              </>
            )}
          </Match>
        </Switch>
      )}
    </>
  )
}

export function NoResources(p: MayHaveClassAndChildren) {
  return (
    <NoData noDataText={ttc("No Resources")} class={p.class}>
      {p.children}
    </NoData>
  )
}

interface ResourceListProps extends MayHaveClass {
  resources: ResourceModel[]
  demo?: boolean
}

function getResourcesPage(
  result: Result<PaginationResultType<ResourceModel>> | undefined,
): PaginationResultType<ResourceModel> | null {
  if (!result?.success) return null
  return result.data
}

function resultHasNoResources(
  result: Result<PaginationResultType<ResourceModel>> | undefined,
  canPrevious: boolean,
): boolean {
  const page = getResourcesPage(result)
  return !!page?.isDone && !canPrevious && page.page.length <= 0
}

function ResourceList(p: ResourceListProps) {
  createEffect(() => {
    if (p.demo) return
    const got = p.resources
    if (!got) return
    if (got.length <= 0) return
    resourceNameAddList(got)
  })
  return (
    <div class={classArr(classesGridCols2xl, "gap-4")}>
      <For each={p.resources} fallback={p.demo ? <NoResources /> : undefined}>
        {(r) => (
          <ResourceCardLink
            resource={r}
            href={p.demo ? pageDemoHref("/resources/:resourceId", { resourceId: r.resourceId }) : undefined}
          />
        )}
      </For>
    </div>
  )
}

function ResourceCreateLink(p: { demo?: boolean }) {
  return (
    <LinkButtonInternal
      icon={mdiPlus}
      to={p.demo ? pageDemoHref("/resources/add") : urlResourceAdd()}
      variant={buttonVariant.filledGreen}
    >
      {ttc("Create Resource")}
    </LinkButtonInternal>
  )
}
