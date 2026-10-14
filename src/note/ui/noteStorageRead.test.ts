import { describe, expect, test } from "bun:test"
import * as a from "valibot"
import { noteStorageRead } from "#src/note/ui/noteStorageRead.ts"

describe("note storage read", () => {
  const store = new Map<string, string>()
  const mockLocalStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  }

  // Ensure localStorage exists in test environment
  if (typeof globalThis.localStorage === "undefined") {
    // @ts-expect-error test mock
    globalThis.localStorage = mockLocalStorage
  }

  test("returns error when key is not in localStorage", () => {
    const schema = a.object({ title: a.string() })
    const result = noteStorageRead("non-existent-note-key", schema)
    expect(result.success).toBe(false)
  })

  test("parses valid JSON data from localStorage", () => {
    const schema = a.object({ title: a.string() })
    localStorage.setItem("test-note-key", JSON.stringify({ title: "My Note" }))
    const result = noteStorageRead("test-note-key", schema)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe("My Note")
    }
    localStorage.removeItem("test-note-key")
  })
})
