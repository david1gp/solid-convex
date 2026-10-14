import { describe, expect, test } from "bun:test"
import { teamParamsParse } from "#src/team/url/teamParamsParse.ts"

describe("teamParamsParse", () => {
  test("parses valid contextual team parameters", () => {
    const result = teamParamsParse({ orgHandle: "acme-corp", teamId: "team-123" })
    expect(result).toEqual({
      success: true,
      data: { orgHandle: "acme-corp", teamId: "team-123" },
    })
  })

  test("parses valid global team parameters without orgHandle", () => {
    const result = teamParamsParse({ teamId: "team-456" })
    expect(result).toEqual({
      success: true,
      data: { teamId: "team-456" },
    })
  })

  test("rejects malformed teamId", () => {
    const result = teamParamsParse({ teamId: "" })
    expect(result.success).toBe(false)
  })

  test("rejects teamId exceeding maximum length", () => {
    const result = teamParamsParse({ teamId: "x".repeat(101) })
    expect(result.success).toBe(false)
  })
})
