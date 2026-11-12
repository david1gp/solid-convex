import { For, Show } from "solid-js"
import { appIcons } from "#src/app/icon/appIcons.ts"
import { teamListSectionStateCreate } from "#src/team/ui/teamListSectionStateCreate.ts"
import { PaginationControls } from "#src/ui/pagination/PaginationControls.tsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { Badge } from "#ui/static/badge/Badge.jsx"

export function TeamListSection(p: { orgHandle?: string; demoState?: ReturnType<typeof teamListSectionStateCreate> }) {
  const state = p.demoState ?? teamListSectionStateCreate(() => p.orgHandle)
  return (
    <section class="px-2 sm:px-4 py-6 space-y-4">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <h2 class="text-xs font-semibold text-muted-foreground">Teams</h2>
          <Badge>{state.teams().length}</Badge>
        </div>
        <Show
          when={state.contextual()}
          fallback={
            <LinkButtonInternal to="/org" icon={appIcons.organization}>
              Choose organization to create a team
            </LinkButtonInternal>
          }
        >
          <LinkButtonInternal to={state.createHref()} icon={appIcons.create} variant={buttonVariant.filledIndigo}>
            Create team
          </LinkButtonInternal>
        </Show>
      </div>
      <Show when={state.error()}>
        <p role="alert" class="text-sm text-destructive">
          {state.error()}
        </p>
      </Show>
      <Show when={state.pagination.loading()}>
        <p class="text-sm text-muted-foreground" role="status">
          Loading teams…
        </p>
      </Show>
      <Show when={!state.pagination.loading() && !state.error() && state.teams().length === 0}>
        <p class="text-sm text-muted-foreground">No teams yet.</p>
      </Show>
      <div class="space-y-3">
        <For each={state.teams()}>
          {(team) => (
            <article class="rounded-md border border-border bg-background p-4 flex items-start justify-between gap-4">
              <div class="min-w-0 space-y-1">
                <LinkButtonInternal to={state.detailHref(team.teamId)} class="font-semibold">
                  {team.name}
                </LinkButtonInternal>
                <Show when={team.description}>
                  <p class="text-sm text-muted-foreground whitespace-pre-wrap break-words">{team.description}</p>
                </Show>
              </div>
              <LinkButtonInternal to={state.editHref(team.teamId)} icon={appIcons.edit}>
                Edit
              </LinkButtonInternal>
            </article>
          )}
        </For>
      </div>
      <PaginationControls
        page={() => state.pagination.history().length + 1}
        canPrevious={state.pagination.canPrevious}
        canNext={state.pagination.canNext}
        previous={state.pagination.previous}
        next={state.pagination.next}
        loading={state.pagination.loading}
      />
    </section>
  )
}
