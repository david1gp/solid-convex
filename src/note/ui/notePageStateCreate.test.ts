import { convexContextRootCreate } from "#src/utils/convex_client/test/convexContextRootCreate.ts"
import { describe, expect, mock, test } from "bun:test"
import { createResult, createResultError } from "#result"

if (!globalThis.sessionStorage) {
  globalThis.sessionStorage = {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
    clear: () => undefined,
    key: () => null,
    length: 0,
  } as unknown as Storage
}
if (!globalThis.localStorage) {
  globalThis.localStorage = {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
    clear: () => undefined,
    key: () => null,
    length: 0,
  } as unknown as Storage
}

import { createRoot, createSignal } from "solid-js"

const [paramsSignal, setParamsSignal] = createSignal<Record<string, string>>({})
const [locationSignal, setLocationSignal] = createSignal<{ pathname: string }>({ pathname: "/note" })

mock.module("@tanstack/solid-router", () => ({
  useParams: () => paramsSignal,
  useLocation: () => locationSignal,
  useNavigate: () => () => undefined,
}))

const { notePageStateCreate } = await import("./notePageStateCreate.ts")
mock.restore()

type QueryUpdate = (value: unknown) => void
type QueryError = (error: Error) => void

class MockConvexClient {
  subscriptions: Array<{
    query: unknown
    args: unknown
    update: QueryUpdate
    onError?: QueryError
  }> = []

  mutation() {
    return Promise.resolve(createResult(true))
  }

  onUpdate(query: unknown, args: unknown, update: QueryUpdate, onError?: QueryError) {
    const entry = { query, args, update, onError }
    this.subscriptions.push(entry)
    return () => {
      const idx = this.subscriptions.indexOf(entry)
      if (idx >= 0) this.subscriptions.splice(idx, 1)
    }
  }

  notifyQuery(matcher: (args: unknown) => boolean, value: unknown) {
    for (const sub of this.subscriptions) {
      if (matcher(sub.args)) {
        sub.update(value)
      }
    }
  }

  failQuery(matcher: (args: unknown) => boolean, error: Error) {
    for (const sub of this.subscriptions) {
      if (matcher(sub.args)) {
        sub.onError?.(error)
      }
    }
  }
}

describe("notePageStateCreate query subscription and error handling", () => {
  test("skips note detail subscription when visiting empty note list with no selected note", () => {
    const client = new MockConvexClient()
    convexContextRootCreate(client, (dispose) => {
      setParamsSignal({})
      setLocationSignal({ pathname: "/note" })
      const state = notePageStateCreate()

      expect(state.selectedNoteId()).toBeUndefined()
      expect(state.noteLoading()).toBe(false)
      expect(state.noteError()).toBe("")

      // Detail query with noteId should not be subscribed
      const detailSub = client.subscriptions.find((s) => {
        const a = s.args as Record<string, unknown> | undefined
        return a && "noteId" in a
      })
      expect(detailSub).toBeUndefined()

      dispose()
    })
  })

  test("subscribes to note detail when note ID is present and displays error when backend returns not found", async () => {
    const client = new MockConvexClient()
    await convexContextRootCreate(client, async (dispose) => {
      setParamsSignal({ noteId: "malformed-note-id" })
      setLocationSignal({ pathname: "/note/malformed-note-id" })
      const state = notePageStateCreate()

      expect(state.selectedNoteId()).toBe("malformed-note-id")
      expect(state.noteLoading()).toBe(true)

      // Detail subscription must be active with the noteId
      const detailSub = client.subscriptions.find((s) => {
        const a = s.args as Record<string, unknown> | undefined
        return a && a.noteId === "malformed-note-id"
      })
      expect(detailSub).toBeDefined()

      // Backend returns structured Result error (e.g. Note not found)
      client.notifyQuery(
        (args) => (args as Record<string, unknown>).noteId === "malformed-note-id",
        createResultError("noteGetFn", "Note not found"),
      )

      expect(state.noteLoading()).toBe(false)
      expect(state.noteError()).toBe("Note not found")

      dispose()
    })
  })

  test("handles subscription onError without endless loading", async () => {
    const client = new MockConvexClient()
    await convexContextRootCreate(client, async (dispose) => {
      setParamsSignal({ noteId: "bad-id" })
      setLocationSignal({ pathname: "/note/bad-id" })
      const state = notePageStateCreate()

      expect(state.noteLoading()).toBe(true)

      // Simulate subscription error
      client.failQuery(
        (args) => (args as Record<string, unknown>).noteId === "bad-id",
        new Error("Convex query subscription error"),
      )

      expect(state.noteLoading()).toBe(false)
      expect(state.noteError()).toBe("Convex query subscription error")

      dispose()
    })
  })
})
