import { describe, expect, it } from "bun:test"
import { assignmentTargetCanonicalBuild } from "#src/assignment/ui/assignmentTargetCanonicalBuild.ts"

describe("assignmentTargetCanonicalBuild", () => {
  it("returns undefined for unassigned or empty kind", () => {
    const r1 = assignmentTargetCanonicalBuild("unassigned")
    expect(r1.success).toBe(true)
    if (r1.success) expect(r1.data).toBeUndefined()

    const r2 = assignmentTargetCanonicalBuild(undefined)
    expect(r2.success).toBe(true)
    if (r2.success) expect(r2.data).toBeUndefined()

    const r3 = assignmentTargetCanonicalBuild(null)
    expect(r3.success).toBe(true)
    if (r3.success) expect(r3.data).toBeUndefined()
  })

  it("builds valid organization target", () => {
    const res = assignmentTargetCanonicalBuild("organization", "org_123")
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data).toEqual({ kind: "organization", id: "org_123" })
    }
  })

  it("builds valid team target", () => {
    const res = assignmentTargetCanonicalBuild("team", "team_456")
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data).toEqual({ kind: "team", id: "team_456" })
    }
  })

  it("builds valid project target", () => {
    const res = assignmentTargetCanonicalBuild("project", "proj_789")
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data).toEqual({ kind: "project", id: "proj_789" })
    }
  })

  it("builds valid note target", () => {
    const res = assignmentTargetCanonicalBuild("note", "note_999")
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data).toEqual({ kind: "note", id: "note_999" })
    }
  })

  it("fails when id is missing or empty", () => {
    const res1 = assignmentTargetCanonicalBuild("team", "")
    expect(res1.success).toBe(false)

    const res2 = assignmentTargetCanonicalBuild("project", undefined)
    expect(res2.success).toBe(false)
  })

  it("fails on invalid target kind without casting", () => {
    const res = assignmentTargetCanonicalBuild("invalid" as any, "123")
    expect(res.success).toBe(false)
  })
})
