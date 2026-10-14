import { For, Show } from "solid-js"
import { noteListSectionStateCreate } from "#src/note/ui/noteListSectionStateCreate.ts"
import { PaginationControls } from "#src/ui/pagination/PaginationControls.tsx"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"

export function NoteListSection(props: { orgHandle?: string; teamId?: string; projectId?: string }) {
  const state = noteListSectionStateCreate(
    () => props.orgHandle,
    () => props.teamId,
    () => props.projectId,
  )

  return (
    <section class="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between gap-4">
        <h2 class="text-xl font-bold">Notes</h2>
        <div class="flex gap-2">
          <LinkButtonInternal to={state.allNotesHref()}>All notes</LinkButtonInternal>
          <LinkButtonInternal to={state.createHref()}>New note</LinkButtonInternal>
        </div>
      </div>
      <Show when={state.error()}>
        <p role="alert" class="text-destructive">
          {state.error()}
        </p>
      </Show>
      <Show when={state.pagination.loading()}>
        <p class="text-muted-foreground" role="status">
          Loading notes…
        </p>
      </Show>
      <Show when={!state.pagination.loading() && !state.error() && state.notes().length === 0}>
        <p class="text-muted-foreground">No notes yet.</p>
      </Show>
      <div class="space-y-3">
        <For each={state.notes()}>
          {(note) => (
            <article class="rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-start justify-between gap-4">
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
