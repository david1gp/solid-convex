import { Show } from "solid-js"
import { appIcons } from "#src/app/icon/appIcons.ts"
import type { Project } from "#src/project/model/projectSchema.ts"
import { projectFormStateCreate } from "#src/project/ui/projectFormStateCreate.ts"
import { FormFieldInput } from "#src/ui/form/FormFieldInput.tsx"
import { ButtonIcon } from "#ui/interactive/button/ButtonIcon.jsx"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"

export function ProjectForm(p: { teamId?: string; orgHandle?: string; project?: Project }) {
  const state = projectFormStateCreate(
    () => p.teamId,
    () => p.orgHandle,
    () => p.project,
  )
  return (
    <section class="px-2 sm:px-4 py-6 max-w-3xl space-y-4">
      <h1 class="text-2xl font-bold">{state.title()}</h1>
      <p class="text-muted-foreground">Team: {state.parent()} · A project's team cannot be changed.</p>
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
