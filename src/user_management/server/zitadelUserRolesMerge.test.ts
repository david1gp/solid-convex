import { expect, test } from "bun:test"
import { userRole } from "#src/auth/model_field/userRole.ts"
import { zitadelUserRolesMerge } from "#src/user_management/server/zitadelUserRolesMerge.ts"

test("zitadelUserRolesMerge preserves unknown existing roles like contributor while updating canonical roles", () => {
  const existing = ["contributor", "admin", "custom-auditor"]
  const desired = [userRole.member, userRole.user]

  const result = zitadelUserRolesMerge(existing, desired)

  // contributor and custom-auditor must be preserved, admin replaced by member and user
  expect(result).toEqual(["contributor", "custom-auditor", "member", "user"])
})

test("zitadelUserRolesMerge works when there are no existing roles", () => {
  const existing: string[] = []
  const desired = [userRole.admin]

  const result = zitadelUserRolesMerge(existing, desired)

  expect(result).toEqual(["admin"])
})

test("zitadelUserRolesMerge preserves contributor when clearing all canonical roles", () => {
  const existing = ["contributor", "user", "member"]
  const desired: never[] = []

  const result = zitadelUserRolesMerge(existing, desired)

  expect(result).toEqual(["contributor"])
})

test("zitadelUserRolesMerge avoids duplicate entries", () => {
  const existing = ["user"]
  const desired = [userRole.user, userRole.user]

  const result = zitadelUserRolesMerge(existing, desired)

  expect(result).toEqual(["user"])
})
