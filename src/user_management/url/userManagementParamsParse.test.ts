import { describe, expect, test } from "bun:test"
import { userManagementParamsParse } from "#src/user_management/url/userManagementParamsParse.ts"

describe("userManagementParamsParse", () => {
  test("parses empty params object", () => {
    const result = userManagementParamsParse({})
    expect(result).toEqual({
      success: true,
      data: {},
    })
  })

  test("parses valid userId", () => {
    const result = userManagementParamsParse({ userId: "user-123" })
    expect(result).toEqual({
      success: true,
      data: { userId: "user-123" },
    })
  })

  test("rejects empty userId", () => {
    const result = userManagementParamsParse({ userId: "" })
    expect(result.success).toBe(false)
  })

  test("rejects userId exceeding max length", () => {
    const result = userManagementParamsParse({ userId: "x".repeat(101) })
    expect(result.success).toBe(false)
  })

  test("rejects invalid non-object input", () => {
    const result = userManagementParamsParse("invalid")
    expect(result.success).toBe(false)
  })
})
