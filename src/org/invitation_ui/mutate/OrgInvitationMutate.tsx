import { Match, Switch } from "solid-js"
import { ttc } from "#src/app/i18n/ttc.ts"
import { OrgInvitationForm } from "#src/org/invitation_ui/form/OrgInvitationForm.tsx"
import { orgInvitationMutateStateCreate } from "#src/org/invitation_ui/mutate/orgInvitationMutateStateCreate.ts"
import type { HasOrgHandle } from "#src/org/org_model_field/HasOrgHandle.ts"
import type { HasOrgInvitationCode } from "#src/org/org_model_field/HasOrgInvitationCode.ts"
import { ErrorPage } from "#src/ui/pages/ErrorPage.tsx"
import { LoadingSection } from "#src/ui/pages/LoadingSection.tsx"
import type { HasFormModeMutate } from "#ui/input/form/formModeMutate.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

interface OrgInvitationMutateProps extends HasOrgHandle, HasOrgInvitationCode, HasFormModeMutate, MayHaveClass {}

export function OrgInvitationMutate(p: OrgInvitationMutateProps) {
  const state = orgInvitationMutateStateCreate({
    mode: () => p.mode,
    orgHandle: () => p.orgHandle,
    invitationCode: () => p.invitationCode,
  })

  return (
    <Switch>
      <Match when={!state.getInvitation()}>
        <OrgInvitationLoading />
      </Match>
      <Match when={state.getInvitationErrorMessage()}>{(errorMessage) => <ErrorPage title={errorMessage()} />}</Match>
      <Match when={state.getInvitationData()}>
        <OrgInvitationForm mode={p.mode} sm={state.sm} />
      </Match>
      <Match when={true}>
        <ErrorPage title={ttc("Invitation not found")} />
      </Match>
    </Switch>
  )
}

function OrgInvitationLoading() {
  return <LoadingSection loadingSubject={ttc("Organization Invitation")} />
}
