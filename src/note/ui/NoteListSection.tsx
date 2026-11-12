import { For, Show } from "solid-js"
import { noteListSectionStateCreate } from "#src/note/ui/noteListSectionStateCreate.ts"
import { PaginationControls } from "#src/ui/pagination/PaginationControls.tsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { Badge } from "#ui/static/badge/Badge.jsx"

export function NoteListSection(props: {
  orgHandle?: string
  teamId?: string
  projectId?: string
  demoState?: ReturnType<typeof noteListSectionStateCreate>
}) {
  const state =
    props.demoState ??
    noteListSectionStateCreate(
      () => props.orgHandle,
      () => props.teamId,
      () => props.projectId,
    )

  return (
    <section class="space-y-4 pt-4 border-t border-border">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <h2 class="text-xs font-semibold text-muted-foreground">Notes</h2>
          <Badge>{state.notes().length}</Badge>
        </div>
        <div class="flex gap-2">
          <LinkButtonInternal to={state.allNotesHref()}>All notes</LinkButtonInternal>
          <LinkButtonInternal to={state.createHref()} variant={buttonVariant.filledIndigo}>
            New note
          </LinkButtonInternal>
        </div>
      </div>
      <Show when={state.error()}>
        <p role="alert" class="text-sm text-destructive">
          {state.error()}
        </p>
      </Show>
      <Show when={state.pagination.loading()}>
        <p class="text-sm text-muted-foreground" role="status">
          Loading notes…
        </p>
      </Show>
      <Show when={!state.pagination.loading() && !state.error() && state.notes().length === 0}>
        <p class="text-sm text-muted-foreground">No notes yet.</p>
      </Show>
      <div class="space-y-3">
        <For each={state.notes()}>
          {(note) => (
            <article class="rounded-md border border-border bg-background p-4 flex items-start justify-between gap-4">
              <div class="min-w-0 space-y-1">
                <LinkButtonInternal to={state.detailHref(note.noteId)} class="font-semibold">
                  {note.title}
                </LinkButtonInternal>
                <p class="text-xs text-muted-foreground">Updated {note.updatedAt}</p>
              </div>
              <LinkButtonInternal to={state.detailHref(note.noteId)}>Open</LinkButtonInternal>
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
