import { Show } from "solid-js"
import type { Team } from "#src/team/model/teamSchema.ts"
import { teamEditPageStateCreate } from "#src/team/ui/teamEditPageStateCreate.ts"
import { teamFormStateCreate } from "#src/team/ui/teamFormStateCreate.ts"
import { TeamForm } from "#src/team/ui/TeamForm.tsx"
import { PageWrapper } from "#ui/static/page/PageWrapper.jsx"

export function TeamEditPage(p: {
  demo?: {
    orgHandle: string | undefined
    team: () => Team | undefined
    form: ReturnType<typeof teamFormStateCreate>
  }
}) {
  if (p.demo) {
    const demo = p.demo
    return (
      <PageWrapper>
        <Show when={demo.team()} fallback={<p>Team not found in demo fixtures.</p>}>
          {(team) => <TeamForm orgHandle={demo.orgHandle} team={team()} demoState={demo.form} />}
        </Show>
      </PageWrapper>
    )
  }
  const state = teamEditPageStateCreate()
  return (
    <PageWrapper>
      <Show when={state.loading()}>
        <p class="p-4 text-sm text-muted-foreground" role="status">
          Loading team…
        </p>
      </Show>
      <Show when={state.error()}>
        <p class="p-4 text-sm text-destructive" role="alert">
          {state.error()}
        </p>
      </Show>
      <Show when={state.team()}>{(team) => <TeamForm orgHandle={state.orgHandle()} team={team()} />}</Show>
    </PageWrapper>
  )
}
