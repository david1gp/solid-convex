import { type JSXElement, Match, Switch } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import type { HasOrgModel } from "#src/org/org_model/HasOrgModel.ts"
import type { HasOrgHandle } from "#src/org/org_model_field/HasOrgHandle.ts"
import { orgLoaderStateCreate } from "#src/org/org_ui/mutate/orgLoaderStateCreate.ts"
import { ErrorPage } from "#src/ui/pages/ErrorPage.tsx"
import { LoadingSection } from "#src/ui/pages/LoadingSection.tsx"
import { resultHasData } from "#src/utils/result/resultHasData.ts"
import { resultHasErrorMessage } from "#src/utils/result/resultHasErrorMessage.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

export interface OrgLoaderProps extends HasOrgHandle, MayHaveClass {
  OrgComponent: (p: OrgComponentProps) => JSXElement
}

export interface OrgComponentProps extends HasOrgModel, MayHaveClass {}

export function OrgLoader(p: OrgLoaderProps) {
  const state = orgLoaderStateCreate({ orgHandle: () => p.orgHandle })
  return (
    <Switch>
      <Match when={!state.getData()}>
        <OrgLoading />
      </Match>
      <Match when={resultHasErrorMessage(state.getData())}>
        {(getErrorMessage) => <ErrorPage title={getErrorMessage()} />}
      </Match>
      <Match when={resultHasData(state.getData())}>
        {(gotData) => p.OrgComponent({ org: gotData(), class: p.class })}
      </Match>
    </Switch>
  )
}

function OrgLoading() {
  return <LoadingSection loadingSubject={ttc("Organization")} />
}
