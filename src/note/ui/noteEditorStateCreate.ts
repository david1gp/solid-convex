import { createEffect, createMemo } from "solid-js"
import { noteTitleDerive } from "#src/note/model/noteTitleDerive.ts"
import { createSignalObject } from "#ui/utils/createSignalObject.ts"

interface NoteEditorStateProps {
  initialContent: () => string
  disabled: () => boolean
  noteKey?: () => string | undefined
  onSave?: (content: string) => void | Promise<void>
}

export function noteEditorStateCreate(
  initialContent: () => string,
  disabled: () => boolean,
  onSave?: (content: string) => void | Promise<void>,
  noteKey?: () => string | undefined,
) {
  const contentSignal = createSignalObject(initialContent())
  const baselineSignal = createSignalObject(initialContent())
  const isSavingSignal = createSignalObject(false)
  const isDirtySignal = createSignalObject(false)
  const hasConflictSignal = createSignalObject(false)

  let lastKey: string | undefined = noteKey ? noteKey() : undefined

  createEffect(() => {
    const key = noteKey ? noteKey() : undefined
    const remote = initialContent()
    const currentBaseline = baselineSignal.get()
    const currentlyDirty = isDirtySignal.get()

    // 1. If note identity changed (switching notes), reset everything
    if (key !== lastKey) {
      lastKey = key
      baselineSignal.set(remote)
      contentSignal.set(remote)
      isDirtySignal.set(false)
      hasConflictSignal.set(false)
      return
    }

    // 2. Same note: check if remote content changed from baseline
    if (remote !== currentBaseline) {
      if (currentlyDirty) {
        // Do NOT overwrite user's unsaved dirty draft! Mark conflict instead.
        hasConflictSignal.set(true)
      } else {
        // Not dirty: accept remote content cleanly
        baselineSignal.set(remote)
        contentSignal.set(remote)
        hasConflictSignal.set(false)
      }
    }
  })

  const title = createMemo(() => noteTitleDerive(contentSignal.get()))

  const contentChange = (event: InputEvent & { currentTarget: HTMLTextAreaElement }) => {
    const val = event.currentTarget.value
    contentSignal.set(val)
    isDirtySignal.set(val !== baselineSignal.get())
    if (val === baselineSignal.get()) {
      hasConflictSignal.set(false)
    }
  }

  const save = async () => {
    if (!onSave || isSavingSignal.get() || disabled()) return
    isSavingSignal.set(true)
    try {
      const current = contentSignal.get()
      await onSave(current)
      // Successful save marks current content as new baseline and clears dirty/conflict
      baselineSignal.set(current)
      isDirtySignal.set(false)
      hasConflictSignal.set(false)
    } finally {
      isSavingSignal.set(false)
    }
  }

  const resolveConflict = () => {
    const remote = initialContent()
    baselineSignal.set(remote)
    contentSignal.set(remote)
    isDirtySignal.set(false)
    hasConflictSignal.set(false)
  }

  const canSave = () => typeof onSave === "function"
  const isDisabled = () => disabled() || isSavingSignal.get()

  return {
    content: () => contentSignal.get(),
    title,
    isSaving: () => isSavingSignal.get(),
    isDirty: () => isDirtySignal.get(),
    hasConflict: () => hasConflictSignal.get(),
    isDisabled,
    canSave,
    contentChange,
    save,
    resolveConflict,
  }
}
