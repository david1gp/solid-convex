import * as a from "valibot"
import { describe, expect, test } from "vitest"
import { assignmentTargetSchema } from "#src/assignment/model/assignmentTargetSchema.ts"

describe("assignmentTargetSchema", () => {
  test("accepts valid discriminated targets for organization, team, project, note", () => {
    const validTargets = [
      { kind: "organization", id: "org123" },
      { kind: "team", id: "team456" },
      { kind: "project", id: "proj789" },
      { kind: "note", id: "note012" },
    ] as const

    for (const target of validTargets) {
      const parsed = a.safeParse(assignmentTargetSchema, target)
      expect(parsed.success).toBe(true)
      if (parsed.success) {
        expect(parsed.output).toEqual(target)
      }
    }
  })

  test("rejects invalid kinds or empty IDs", () => {
    const invalidTargets = [
      { kind: "workspace", id: "ws123" },
      { kind: "user", id: "user123" },
      { kind: "organization", id: "" },
      { kind: "team", id: "   " },
      { kind: "project" },
      { id: "proj789" },
      null,
      undefined,
      "not-an-object",
    ]

    for (const target of invalidTargets) {
      const parsed = a.safeParse(assignmentTargetSchema, target)
      expect(parsed.success).toBe(false)
    }
  })
})
