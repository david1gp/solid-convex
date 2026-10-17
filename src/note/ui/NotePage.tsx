import { mdiChevronDown } from "@adaptive-ds/mdi/mdiChevronDown.js"
import { For, Show } from "solid-js"
import { HierarchyDeleteDialog } from "#src/hierarchy_delete/ui/HierarchyDeleteDialog.tsx"
import { NoteEditor } from "#src/note/ui/NoteEditor.tsx"
import { notePageStateCreate } from "#src/note/ui/notePageStateCreate.ts"
import { PaginationControls } from "#src/ui/pagination/PaginationControls.tsx"
import { Button } from "#ui/interactive/button/Button.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { Icon } from "#ui/static/icon/Icon.jsx"

export function NotePage() {
  const state = notePageStateCreate()

  return (
    <div class="flex flex-col md:flex-row flex-1 min-h-[calc(100dvh-3.5rem)] md:h-dvh">
      {/* Column 2: Note List Panel */}
      <section class="w-full md:w-80 lg:w-96 shrink-0 border-b md:border-b-0 md:border-r border-border-subtle flex flex-col p-4 gap-4 overflow-y-auto">
        <nav aria-label="Breadcrumb" class="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <LinkButtonInternal to="/org">Organizations</LinkButtonInternal>
          <Show when={state.orgHandle()}>
            <LinkButtonInternal to={`/org/${encodeURIComponent(state.orgHandle()!)}`}>
              {state.orgHandle()}
            </LinkButtonInternal>
          </Show>
          <Show when={state.teamId()}>
            <LinkButtonInternal to={`/team/${encodeURIComponent(state.teamId()!)}`}>Team</LinkButtonInternal>
          </Show>
          <Show when={state.projectHref()}>
            <LinkButtonInternal to={state.projectHref()!}>Project</LinkButtonInternal>
          </Show>
        </nav>

        <header class="flex flex-col gap-2">
          <div class="flex items-center justify-between gap-2">
            <h1 class="text-xl font-bold">Notes</h1>
            <Show when={state.projectId()}>
              <LinkButtonInternal to={state.createHref()}>New note</LinkButtonInternal>
            </Show>
          </div>
          <Show when={!state.projectId()}>
            <div class="space-y-1">
              <label for="new-note-project-select" class="text-xs text-muted-foreground">
                Create note under project:
              </label>
              <div class="relative w-full min-w-0">
                <select
                  id="new-note-project-select"
                  class="w-full appearance-none text-sm border rounded pl-2 pr-10 py-1.5 bg-background text-foreground border-input"
                  onChange={state.onSelectProjectForNewNote}
                >
                  <option value="">Choose project…</option>
                  <For each={state.availableProjects()}>
                    {(project) => <option value={project.projectId}>{project.name}</option>}
                  </For>
                </select>
                <Icon
                  path={mdiChevronDown}
                  class="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-foreground"
                />
              </div>
            </div>
          </Show>
        </header>

        <Show when={state.listError()}>
          <p role="alert" class="text-sm text-destructive">
            {state.listError()}
          </p>
        </Show>

        <Show when={state.pagination.loading()}>
          <p role="status" class="text-sm text-muted-foreground">
            Loading notes…
          </p>
        </Show>

        <Show when={!state.pagination.loading() && !state.listError() && state.notes().length === 0}>
          <p class="text-sm text-muted-foreground">No notes found.</p>
        </Show>

        <div class="flex-1 space-y-2">
          <For each={state.notes()}>
            {(note) => {
              const isSelected = () => note.noteId === state.selectedNoteId()
              return (
                <article
                  class={`rounded-lg border p-3 transition-colors ${
                    isSelected()
                      ? "border-primary bg-primary/5 dark:bg-primary/10"
                      : "border-border-subtle hover:border-border"
                  }`}
                >
                  <LinkButtonInternal to={state.noteItemHref(note)} class="block font-medium truncate text-sm">
                    {note.title}
                  </LinkButtonInternal>
                  <p class="text-xs text-muted-foreground mt-1">Updated {note.updatedAt}</p>
                </article>
              )
            }}
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

      {/* Column 3: Detail / Editor Panel */}
      <section class="flex-1 min-w-0 flex flex-col p-4 overflow-y-auto">
        <Show when={state.saveStatus()}>
          <p role="status" class="text-sm text-green-600 dark:text-green-400 mb-2">
            {state.saveStatus()}
          </p>
        </Show>
        <Show when={state.saveError()}>
          <p role="alert" class="text-sm text-destructive mb-2">
            {state.saveError()}
          </p>
        </Show>

        <Show when={state.isCreate()}>
          <Show
            when={state.projectId()}
            fallback={
              <div class="p-6 text-center text-muted-foreground space-y-3">
                <p>Choose a project from the left panel to create a note.</p>
              </div>
            }
          >
            <div class="flex flex-col flex-1 min-h-[400px]">
              <div class="px-4 pt-2 text-xs text-muted-foreground">Creating note in project {state.projectId()}</div>
              <NoteEditor
                content={() => ""}
                noteKey={() => "create"}
                disabled={state.isSaving}
                onSave={state.saveNote}
              />
            </div>
          </Show>
        </Show>

        <Show when={!state.isCreate() && state.selectedNoteId()}>
          <Show when={state.noteLoading()}>
            <p role="status" class="text-sm text-muted-foreground p-4">
              Loading note…
            </p>
          </Show>
          <Show when={state.noteError()}>
            <p role="alert" class="text-sm text-destructive p-4">
              {state.noteError()}
            </p>
          </Show>
          <Show when={state.currentNote()}>
            {(note) => (
              <div class="flex flex-col flex-1">
                <NoteEditor
                  content={() => note().content}
                  noteKey={() => note().noteId}
                  disabled={state.isSaving}
                  onSave={state.saveNote}
                />
                <footer class="mt-auto px-4 py-3 text-xs text-muted-foreground border-t border-border-subtle flex flex-wrap items-center justify-between gap-4">
                  <div class="flex flex-wrap gap-4">
                    <span>Project: {note().projectId}</span>
                    <span>Created: {note().createdAt}</span>
                    <span>Updated: {note().updatedAt}</span>
                  </div>
                  <Button variant={buttonVariant.outlineRed} onClick={() => state.deleteDialogOpen.set(true)}>
                    Delete note
                  </Button>
                </footer>
              </div>
            )}
          </Show>
        </Show>

        <Show when={!state.isCreate() && !state.selectedNoteId()}>
          <div class="flex flex-col items-center justify-center flex-1 p-8 text-center text-muted-foreground space-y-3">
            <p class="text-base font-medium">No note selected</p>
            <p class="text-sm">Select a note from the list, or create a new note under a project.</p>
            <Show when={state.projectId()}>
              <LinkButtonInternal to={state.createHref()}>Create note</LinkButtonInternal>
            </Show>
          </div>
        </Show>
      </section>

      <HierarchyDeleteDialog
        target={state.deleteTarget}
        isOpen={state.deleteDialogOpen}
        dialogKey="delete"
        onSuccess={state.onDeleteSuccess}
      />
    </div>
  )
}
