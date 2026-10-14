import { Show } from "solid-js"
import { teamEditPageStateCreate } from "#src/team/ui/teamEditPageStateCreate.ts"
import { TeamForm } from "#src/team/ui/TeamForm.tsx"
import { PageWrapper } from "#ui/static/page/PageWrapper.jsx"

export function TeamEditPage() {
  const state = teamEditPageStateCreate()
  return (
    <PageWrapper>
      <Show when={state.loading()}>
        <p class="p-4" role="status">
          Loading team…
        </p>
      </Show>
      <Show when={state.error()}>
        <p class="p-4 text-destructive" role="alert">
          {state.error()}
        </p>
      </Show>
      <Show when={state.team()}>{(team) => <TeamForm orgHandle={state.orgHandle()} team={team()} />}</Show>
    </PageWrapper>
  )
}
