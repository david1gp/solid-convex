import { describe, expect, test } from "bun:test"
import { noteHrefGet } from "#src/note/ui/noteHrefGet.ts"

describe("note UI navigation", () => {
  test("global navigation routes without parent context", () => {
    expect(noteHrefGet("list")).toBe("/note")
    expect(noteHrefGet("detail", { noteId: "note-1" })).toBe("/note/note-1")
    expect(noteHrefGet("edit", { noteId: "note-1" })).toBe("/note/note-1/edit")
  })

  test("creation without project context falls back to default list", () => {
    expect(noteHrefGet("create")).toBe("/note")
  })

  test("project contextual navigation builds project note URLs", () => {
    expect(noteHrefGet("list", { projectId: "proj-1" })).toBe("/project/proj-1/note")
    expect(noteHrefGet("create", { projectId: "proj-1" })).toBe("/project/proj-1/note/create")
    expect(noteHrefGet("detail", { projectId: "proj-1", noteId: "note-1" })).toBe("/project/proj-1/note/note-1")
    expect(noteHrefGet("edit", { projectId: "proj-1", noteId: "note-1" })).toBe("/project/proj-1/note/note-1/edit")
  })

  test("org, team, and project contextual navigation preserves hierarchy in URLs", () => {
    expect(noteHrefGet("list", { orgHandle: "acme", teamId: "team-1", projectId: "proj-1" })).toBe(
      "/org/acme/team/team-1/project/proj-1/note",
    )
    expect(noteHrefGet("create", { orgHandle: "acme", teamId: "team-1", projectId: "proj-1" })).toBe(
      "/org/acme/team/team-1/project/proj-1/note/create",
    )
    expect(
      noteHrefGet("detail", {
        orgHandle: "acme",
        teamId: "team-1",
        projectId: "proj-1",
        noteId: "note-1",
      }),
    ).toBe("/org/acme/team/team-1/project/proj-1/note/note-1")
    expect(
      noteHrefGet("edit", {
        orgHandle: "acme",
        teamId: "team-1",
        projectId: "proj-1",
        noteId: "note-1",
      }),
    ).toBe("/org/acme/team/team-1/project/proj-1/note/note-1/edit")
  })

  test("team and project contextual navigation preserves team and project", () => {
    expect(noteHrefGet("list", { teamId: "team-1", projectId: "proj-1" })).toBe("/team/team-1/project/proj-1/note")
    expect(noteHrefGet("create", { teamId: "team-1", projectId: "proj-1" })).toBe(
      "/team/team-1/project/proj-1/note/create",
    )
  })
})
