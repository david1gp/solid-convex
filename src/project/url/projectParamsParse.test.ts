import { describe, expect, test } from "bun:test"
import { projectParamsParse } from "#src/project/url/projectParamsParse.ts"

describe("projectParamsParse", () => {
  test("parses valid contextual project parameters", () => {
    const result = projectParamsParse({
      orgHandle: "acme-corp",
      teamId: "team-123",
      projectId: "proj-123",
    })
    expect(result).toEqual({
      success: true,
      data: {
        orgHandle: "acme-corp",
        teamId: "team-123",
        projectId: "proj-123",
      },
    })
  })

  test("parses valid global project parameters without orgHandle or teamId", () => {
    const result = projectParamsParse({ projectId: "proj-456" })
    expect(result).toEqual({
      success: true,
      data: { projectId: "proj-456" },
    })
  })

  test("rejects malformed projectId", () => {
    const result = projectParamsParse({ projectId: "" })
    expect(result.success).toBe(false)
  })

  test("rejects malformed teamId", () => {
    const result = projectParamsParse({ teamId: "" })
    expect(result.success).toBe(false)
  })
})
