import { Show } from "solid-js"
import { appIcons } from "#src/app/icon/appIcons.ts"
import type { Team } from "#src/team/model/teamSchema.ts"
import { teamFormStateCreate } from "#src/team/ui/teamFormStateCreate.ts"
import { FormFieldInput } from "#src/ui/form/FormFieldInput.tsx"
import { ButtonIcon } from "#ui/interactive/button/ButtonIcon.jsx"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"

export function TeamForm(p: { orgHandle?: string; team?: Team }) {
  const state = teamFormStateCreate(
    () => p.orgHandle,
    () => p.team,
  )
  return (
    <section class="px-2 sm:px-4 py-6 max-w-3xl space-y-4">
      <h1 class="text-2xl font-bold">{state.title()}</h1>
      <p class="text-muted-foreground">Organization: {state.parent()} · A team's organization cannot be changed.</p>
      <form class="space-y-4" onSubmit={state.submit}>
        <FormFieldInput
          config={state.nameConfig}
          value={state.name()}
          error=""
          mode={state.mode()}
          disabled={state.busy()}
          onInput={state.nameChange}
          onBlur={state.blur}
        />
        <FormFieldInput
          config={state.descriptionConfig}
          value={state.description()}
          error=""
          mode={state.mode()}
          disabled={state.busy()}
          onInput={state.descriptionChange}
          onBlur={state.blur}
        />
        <Show when={state.error()}>
          <p role="alert" class="text-destructive">
            {state.error()}
          </p>
        </Show>
        <div class="flex gap-3">
          <ButtonIcon type="submit" icon={appIcons.save} isLoading={state.busy()} disabled={state.busy()}>
            {state.busy() ? "Saving…" : state.title()}
          </ButtonIcon>
          <LinkButtonInternal to={state.cancelHref()} icon={appIcons.cancel}>
            Cancel
          </LinkButtonInternal>
        </div>
      </form>
    </section>
  )
}
