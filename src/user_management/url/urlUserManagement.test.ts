import { describe, expect, it } from "bun:test"
import { urlUserManagement } from "./urlUserManagement.ts"

describe("urlUserManagement", () => {
  it("returns base user management route when userId is omitted", () => {
    expect(urlUserManagement()).toBe("/user-management")
  })

  it("returns route with encoded userId when provided", () => {
    expect(urlUserManagement("user_123")).toBe("/user-management/user_123")
    expect(urlUserManagement("user with spaces")).toBe("/user-management/user%20with%20spaces")
  })
})
