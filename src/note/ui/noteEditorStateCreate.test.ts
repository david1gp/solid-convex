import { describe, expect, mock, test } from "bun:test"

const solidJsClientPath = "solid-js/dist/solid.js"
type SolidJsModule = typeof import("solid-js")
const solidJsClient = (await import(solidJsClientPath)) as unknown as SolidJsModule
mock.module("solid-js", () => solidJsClient)
const { createRoot, createSignal } = solidJsClient
mock.restore()

const { noteEditorStateCreate } = await import("#src/note/ui/noteEditorStateCreate.ts")

describe("noteEditorStateCreate", () => {
  test("dirty edit survives remote refresh", async () => {
    await createRoot(async (dispose) => {
      const [remoteContent, setRemoteContent] = createSignal("# Initial note")
      const [noteKey] = createSignal<string | undefined>("note-1")

      const state = noteEditorStateCreate(
        () => remoteContent(),
        () => false,
        undefined,
        () => noteKey(),
      )

      expect(state.content()).toBe("# Initial note")
      expect(state.isDirty()).toBe(false)
      expect(state.hasConflict()).toBe(false)

      // User types local changes making the draft dirty
      state.contentChange({
        currentTarget: { value: "# Local unsaved draft" } as HTMLTextAreaElement,
      } as InputEvent & { currentTarget: HTMLTextAreaElement })

      expect(state.content()).toBe("# Local unsaved draft")
      expect(state.isDirty()).toBe(true)

      // Remote refreshes with new background update
      setRemoteContent("# Remote background update")

      // Wait a tick for effects
      await new Promise((r) => setTimeout(r, 10))

      // Unsaved draft survives! Not overwritten.
      expect(state.content()).toBe("# Local unsaved draft")
      expect(state.isDirty()).toBe(true)
      expect(state.hasConflict()).toBe(true)

      dispose()
    })
  })

  test("note switch resets editor draft and conflict", async () => {
    await createRoot(async (dispose) => {
      const [remoteContent, setRemoteContent] = createSignal("# Note 1 Content")
      const [noteKey, setNoteKey] = createSignal<string | undefined>("note-1")

      const state = noteEditorStateCreate(
        () => remoteContent(),
        () => false,
        undefined,
        () => noteKey(),
      )

      // Make note-1 dirty
      state.contentChange({
        currentTarget: { value: "# Note 1 modified" } as HTMLTextAreaElement,
      } as InputEvent & { currentTarget: HTMLTextAreaElement })

      expect(state.isDirty()).toBe(true)

      // Switch to note-2
      setNoteKey("note-2")
      setRemoteContent("# Note 2 Content")

      await new Promise((r) => setTimeout(r, 10))

      // Switched cleanly to note-2 content and dirty reset
      expect(state.content()).toBe("# Note 2 Content")
      expect(state.isDirty()).toBe(false)
      expect(state.hasConflict()).toBe(false)

      dispose()
    })
  })

  test("saved then remote accepted", async () => {
    await createRoot(async (dispose) => {
      const [remoteContent, setRemoteContent] = createSignal("# Version 1")
      const [noteKey] = createSignal<string | undefined>("note-1")

      let savedContent = ""
      const onSave = async (content: string) => {
        savedContent = content
      }

      const state = noteEditorStateCreate(
        () => remoteContent(),
        () => false,
        onSave,
        () => noteKey(),
      )

      // Edit locally
      state.contentChange({
        currentTarget: { value: "# Version 2 local" } as HTMLTextAreaElement,
      } as InputEvent & { currentTarget: HTMLTextAreaElement })

      expect(state.isDirty()).toBe(true)

      // Save note
      await state.save()
      expect(savedContent).toBe("# Version 2 local")
      expect(state.isDirty()).toBe(false)

      // Now server responds with Version 2
      setRemoteContent("# Version 2 local")
      await new Promise((r) => setTimeout(r, 10))

      expect(state.content()).toBe("# Version 2 local")
      expect(state.isDirty()).toBe(false)
      expect(state.hasConflict()).toBe(false)

      // Subsequent remote update accepted since not dirty
      setRemoteContent("# Version 3 remote")
      await new Promise((r) => setTimeout(r, 10))

      expect(state.content()).toBe("# Version 3 remote")
      expect(state.isDirty()).toBe(false)
      expect(state.hasConflict()).toBe(false)

      dispose()
    })
  })
})
