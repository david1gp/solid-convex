import { describe, expect, test } from "bun:test"
import { noteParamsParse } from "#src/note/url/noteParamsParse.ts"

describe("note URL params parsing", () => {
  test("accepts empty params for global note routes", () => {
    const result = noteParamsParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.orgHandle).toBeUndefined()
      expect(result.data.teamId).toBeUndefined()
      expect(result.data.projectId).toBeUndefined()
      expect(result.data.noteId).toBeUndefined()
    }
  })

  test("accepts valid contextual params", () => {
    const result = noteParamsParse({
      orgHandle: "acme-corp",
      teamId: "team-123",
      projectId: "proj-456",
      noteId: "note-789",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.orgHandle).toBe("acme-corp")
      expect(result.data.teamId).toBe("team-123")
      expect(result.data.projectId).toBe("proj-456")
      expect(result.data.noteId).toBe("note-789")
    }
  })

  test("rejects invalid org handles", () => {
    const result = noteParamsParse({ orgHandle: "INVALID/HANDLE" })
    expect(result.success).toBe(false)
  })
})
