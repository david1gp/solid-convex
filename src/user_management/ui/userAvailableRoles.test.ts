import { describe, expect, test } from "bun:test"
import { userAvailableRolesRead, userManagementMembersFilter, userRoleFilterOptionsGet } from "./userAvailableRoles.ts"

function memberWithRoles(roles: string[]) {
  return {
    userId: "user-id",
    organizationId: "org-id",
    roles,
    teamIds: [],
    syncedAt: "2026-10-14T00:00:00.000Z",
  }
}

describe("userAvailableRolesRead", () => {
  test("offers the generic base roles admin and user when no other roles exist", () => {
    expect(userAvailableRolesRead([])).toEqual(["admin", "user"])
  })

  test("keeps roles already present in the project alongside the base roles", () => {
    expect(
      userAvailableRolesRead([memberWithRoles(["member", "auditor"]), memberWithRoles(["admin", "auditor"])]),
    ).toEqual(["admin", "user", "auditor", "member"])
  })

  test("deduplicates roles across members", () => {
    expect(userAvailableRolesRead([memberWithRoles(["member"]), memberWithRoles(["member"])])).toEqual([
      "admin",
      "user",
      "member",
    ])
  })
})

describe("userManagementMembersFilter", () => {
  const members = [
    { ...memberWithRoles(["admin"]), userId: "admin-1" },
    { ...memberWithRoles(["member"]), userId: "member-1" },
    { ...memberWithRoles([]), userId: "roleless-1" },
  ]

  test("filter 'all' shows members with at least one role", () => {
    expect(userManagementMembersFilter(members, "all").map((m) => m.userId)).toEqual(["admin-1", "member-1"])
  })

  test("role filter narrows to members holding that role", () => {
    expect(userManagementMembersFilter(members, "admin").map((m) => m.userId)).toEqual(["admin-1"])
    expect(userManagementMembersFilter(members, "auditor")).toEqual([])
  })
})

describe("userRoleFilterOptionsGet", () => {
  test("starts with 'all' followed by available roles", () => {
    expect(userRoleFilterOptionsGet([memberWithRoles(["member"])])).toEqual(["all", "admin", "user", "member"])
  })
})
