import { describe, expect, test } from "bun:test"
import { userManagementLastAdminGuard } from "./userManagementLastAdminGuard.ts"

const projectId = "proj-200"

describe("userManagementLastAdminGuard", () => {
  test("passes when the desired set keeps admin", () => {
    const result = userManagementLastAdminGuard({
      grants: [{ userId: "admin-1", projectId, roleKeys: ["admin"], state: 1 }],
      targetUserId: "admin-1",
      projectId,
      desiredRoles: ["admin", "member"],
    })
    expect(result.success).toBe(true)
  })

  test("passes when the target holds no active admin grant", () => {
    const result = userManagementLastAdminGuard({
      grants: [
        { userId: "admin-1", projectId, roleKeys: ["admin"], state: 1 },
        { userId: "user-1", projectId, roleKeys: ["member"], state: 1 },
      ],
      targetUserId: "user-1",
      projectId,
      desiredRoles: ["user"],
    })
    expect(result.success).toBe(true)
  })

  test("refuses to remove the last project admin", () => {
    const result = userManagementLastAdminGuard({
      grants: [
        { userId: "admin-1", projectId, roleKeys: ["admin", "member"], state: 1 },
        { userId: "user-1", projectId, roleKeys: ["member"], state: 1 },
      ],
      targetUserId: "admin-1",
      projectId,
      desiredRoles: ["member"],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errorMessage).toBe("The last admin role cannot be removed")
    }
  })

  test("passes admin removal when a second admin remains", () => {
    const result = userManagementLastAdminGuard({
      grants: [
        { userId: "admin-1", projectId, roleKeys: ["admin"], state: 1 },
        { userId: "admin-2", projectId, roleKeys: ["admin", "user"], state: 1 },
      ],
      targetUserId: "admin-1",
      projectId,
      desiredRoles: ["member"],
    })
    expect(result.success).toBe(true)
  })

  test("ignores inactive admin grants when counting remaining admins", () => {
    const result = userManagementLastAdminGuard({
      grants: [
        { userId: "admin-1", projectId, roleKeys: ["admin"], state: 1 },
        { userId: "admin-2", projectId, roleKeys: ["admin"], state: 2 },
      ],
      targetUserId: "admin-1",
      projectId,
      desiredRoles: ["member"],
    })
    expect(result.success).toBe(false)
  })

  test("ignores grants from other projects", () => {
    const result = userManagementLastAdminGuard({
      grants: [
        { userId: "admin-1", projectId, roleKeys: ["admin"], state: 1 },
        { userId: "admin-2", projectId: "other-proj", roleKeys: ["admin"], state: 1 },
      ],
      targetUserId: "admin-1",
      projectId,
      desiredRoles: ["member"],
    })
    expect(result.success).toBe(false)
  })
})
