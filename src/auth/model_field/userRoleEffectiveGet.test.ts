import { expect, test } from "bun:test"
import { userRole } from "#src/auth/model_field/userRole.ts"
import { userRoleEffectiveGet } from "#src/auth/model_field/userRoleEffectiveGet.ts"

test("userRoleEffectiveGet defaults to user when roles are empty or undefined", () => {
  expect(userRoleEffectiveGet(undefined)).toBe(userRole.user)
  expect(userRoleEffectiveGet(null)).toBe(userRole.user)
  expect(userRoleEffectiveGet([])).toBe(userRole.user)
})

test("userRoleEffectiveGet resolves single roles", () => {
  expect(userRoleEffectiveGet([userRole.user])).toBe(userRole.user)
  expect(userRoleEffectiveGet([userRole.member])).toBe(userRole.member)
  expect(userRoleEffectiveGet([userRole.admin])).toBe(userRole.admin)
})

test("userRoleEffectiveGet resolves priority admin > member > user", () => {
  expect(userRoleEffectiveGet([userRole.user, userRole.member])).toBe(userRole.member)
  expect(userRoleEffectiveGet([userRole.member, userRole.user])).toBe(userRole.member)
  expect(userRoleEffectiveGet([userRole.member, userRole.admin])).toBe(userRole.admin)
  expect(userRoleEffectiveGet([userRole.user, userRole.admin])).toBe(userRole.admin)
  expect(userRoleEffectiveGet([userRole.user, userRole.member, userRole.admin])).toBe(userRole.admin)
})
