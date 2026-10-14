import { describe, expect, it } from "bun:test"
import { assignmentUrlPrefillParse } from "#src/assignment/ui/assignmentUrlPrefillParse.ts"

describe("assignmentUrlPrefillParse", () => {
  it("parses empty search query as unassigned", () => {
    const res = assignmentUrlPrefillParse("")
    expect(res.kind).toBe("unassigned")
    expect(res.target).toBeUndefined()
  })

  it("prefills note level when noteId is present with parent cascade", () => {
    const res = assignmentUrlPrefillParse("?orgId=org_1&teamId=team_2&projectId=proj_3&noteId=note_4")
    expect(res.kind).toBe("note")
    expect(res.orgId).toBe("org_1")
    expect(res.teamId).toBe("team_2")
    expect(res.projectId).toBe("proj_3")
    expect(res.noteId).toBe("note_4")
    expect(res.target).toEqual({ kind: "note", id: "note_4" })
  })

  it("prefills project level when projectId is present without noteId", () => {
    const res = assignmentUrlPrefillParse("?orgId=org_1&teamId=team_2&projectId=proj_3")
    expect(res.kind).toBe("project")
    expect(res.orgId).toBe("org_1")
    expect(res.teamId).toBe("team_2")
    expect(res.projectId).toBe("proj_3")
    expect(res.target).toEqual({ kind: "project", id: "proj_3" })
  })

  it("prefills team level when teamId is present", () => {
    const res = assignmentUrlPrefillParse("?orgId=org_1&teamId=team_2")
    expect(res.kind).toBe("team")
    expect(res.orgId).toBe("org_1")
    expect(res.teamId).toBe("team_2")
    expect(res.target).toEqual({ kind: "team", id: "team_2" })
  })

  it("prefills organization level when orgId is present", () => {
    const res = assignmentUrlPrefillParse("?orgId=org_1")
    expect(res.kind).toBe("organization")
    expect(res.orgId).toBe("org_1")
    expect(res.target).toEqual({ kind: "organization", id: "org_1" })
  })

  it("respects explicit assignmentKind and assignmentId params", () => {
    const res = assignmentUrlPrefillParse("?assignmentKind=team&assignmentId=team_99")
    expect(res.kind).toBe("team")
    expect(res.teamId).toBe("team_99")
    expect(res.target).toEqual({ kind: "team", id: "team_99" })
  })

  it("rejects invalid assignmentKind via Valibot schema validation and falls back to unassigned", () => {
    const res = assignmentUrlPrefillParse("?assignmentKind=invalid_kind&assignmentId=some_id")
    expect(res.kind).toBe("unassigned")
    expect(res.target).toBeUndefined()
  })

  it("treats whitespace-only IDs as undefined and returns unassigned", () => {
    const res = assignmentUrlPrefillParse("?assignmentKind=team&assignmentId=%20%20")
    expect(res.kind).toBe("unassigned")
    expect(res.target).toBeUndefined()
  })

  it("parses explicit assignmentKind=unassigned cleanly", () => {
    const res = assignmentUrlPrefillParse("?assignmentKind=unassigned&orgId=org_1")
    expect(res.kind).toBe("unassigned")
    expect(res.orgId).toBe("org_1")
    expect(res.target).toBeUndefined()
  })
})
