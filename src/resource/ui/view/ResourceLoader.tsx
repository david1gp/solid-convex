import { type JSXElement, Match, Switch } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import type { HasResourceId } from "#src/resource/model/HasResourceId.ts"
import type { HasResourceModel } from "#src/resource/model/HasResourceModel.ts"
import { resourceLoaderStateCreate } from "#src/resource/ui/view/resourceLoaderStateCreate.ts"
import { ErrorPage } from "#src/ui/pages/ErrorPage.tsx"
import { LoadingSection } from "#src/ui/pages/LoadingSection.tsx"
import { resultHasErrorMessage } from "#src/utils/result/resultHasErrorMessage.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

export interface ResourceLoaderProps extends HasResourceId, MayHaveClass {
  ResourceComponent: (p: ResourceComponentProps) => JSXElement
}

export interface ResourceComponentProps extends HasResourceModel, MayHaveClass {}

export function ResourceLoader(p: ResourceLoaderProps) {
  const state = resourceLoaderStateCreate({ resourceId: () => p.resourceId })
  return (
    <Switch>
      <Match when={!state.getData()}>
        <ResourceLoading />
      </Match>
      <Match when={resultHasErrorMessage(state.getData())}>
        {(getErrorMessage) => <ErrorPage title={getErrorMessage()} />}
      </Match>
      <Match when={state.loadedData()}>
        {(getLoadedData) =>
          p.ResourceComponent({
            resource: getLoadedData(),
            class: p.class,
          })
        }
      </Match>
    </Switch>
  )
}

function ResourceLoading() {
  return <LoadingSection loadingSubject={ttc("Resource")} />
}
