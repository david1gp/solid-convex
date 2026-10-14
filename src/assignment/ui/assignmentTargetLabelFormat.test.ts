import { describe, expect, test } from "vitest"
import { assignmentTargetLabelFormat } from "#src/assignment/ui/assignmentTargetLabelFormat.ts"

describe("assignmentTargetLabelFormat", () => {
  test("formats labels for each target kind", () => {
    expect(assignmentTargetLabelFormat({ kind: "organization" })).toBe("Organization")
    expect(assignmentTargetLabelFormat({ kind: "team" })).toBe("Team")
    expect(assignmentTargetLabelFormat({ kind: "project" })).toBe("Project")
    expect(assignmentTargetLabelFormat({ kind: "note" })).toBe("Note")
  })

  test("formats unassigned label when target is null or undefined", () => {
    expect(assignmentTargetLabelFormat(undefined)).toBe("Unassigned")
    expect(assignmentTargetLabelFormat(null)).toBe("Unassigned")
  })
})
