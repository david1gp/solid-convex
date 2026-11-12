import { Show } from "solid-js"
import { noteEditorStateCreate } from "#src/note/ui/noteEditorStateCreate.ts"

export function NoteEditor(props: {
  content?: () => string
  noteKey?: () => string | undefined
  disabled?: () => boolean
  onSave?: (content: string) => void | Promise<void>
}) {
  const state = noteEditorStateCreate(
    () => props.content?.() ?? "",
    () => props.disabled?.() ?? false,
    props.onSave,
    props.noteKey,
  )

  return (
    <section class="flex flex-col gap-3 w-full h-full p-4">
      <header class="flex items-center justify-between">
        <h2 class="text-xl font-semibold truncate" title={state.title()}>
          {state.title()}
        </h2>
        <div class="flex items-center gap-2">
          <Show when={state.isDirty()}>
            <span class="text-xs text-muted-foreground italic">Unsaved changes</span>
          </Show>
          <Show when={state.canSave()}>
            <button
              type="button"
              class="h-7 px-2 text-sm rounded-md bg-primary text-primary-foreground disabled:opacity-50"
              disabled={state.isDisabled()}
              onClick={state.save}
            >
              {state.isSaving() ? "Saving…" : "Save"}
            </button>
          </Show>
        </div>
      </header>
      <Show when={state.hasConflict()}>
        <aside
          role="alert"
          class="flex items-center justify-between p-2.5 rounded-md text-xs bg-warning-soft text-warning border border-warning/20"
        >
          <span>A newer version of this note exists on the server. Your unsaved draft was preserved.</span>
          <button
            type="button"
            class="px-2 py-0.5 rounded-md border border-warning/30 hover:bg-warning/10 text-xs font-medium shrink-0 ml-2"
            onClick={state.resolveConflict}
          >
            Accept remote
          </button>
        </aside>
      </Show>
      <textarea
        class="w-full flex-1 min-h-[300px] p-3 rounded-md border border-input bg-background text-foreground font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder="Type Markdown content here… First line becomes the title."
        value={state.content()}
        disabled={state.isDisabled()}
        onInput={state.contentChange}
      />
    </section>
  )
}
