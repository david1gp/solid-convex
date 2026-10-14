import { expect, test } from "bun:test"
import { type UserRole, userRole } from "#src/auth/model_field/userRole.ts"
import { userRoleCheckMultipleFieldStateCreate } from "#src/user_management/ui/userRoleCheckMultipleFieldStateCreate.ts"
import { createSignalObject } from "#ui/utils/createSignalObject.ts"

test("userRoleCheckMultipleFieldStateCreate returns canonical role options", () => {
  const signal = createSignalObject<UserRole[]>([userRole.user])
  const state = userRoleCheckMultipleFieldStateCreate({
    rolesSignal: () => signal,
  })

  expect(state.getOptions()).toEqual([userRole.user, userRole.member, userRole.admin])
  expect(state.valueText(userRole.user)).toBe("User")
  expect(state.valueText(userRole.member)).toBe("Member")
  expect(state.valueText(userRole.admin)).toBe("Admin")
  expect(state.isDisabled()).toBe(false)
})

test("userRoleCheckMultipleFieldStateCreate supports disabled accessor and subtitles", () => {
  const signal = createSignalObject<UserRole[]>([userRole.admin, userRole.member])
  const state = userRoleCheckMultipleFieldStateCreate({
    rolesSignal: () => signal,
    disabled: () => true,
  })

  expect(state.isDisabled()).toBe(true)
  expect(state.valueTextSubtitle(userRole.admin)).toContain("administration")
  expect(state.valueTextSubtitle(userRole.member)).toContain("member")
  expect(state.valueTextSubtitle(userRole.user)).toContain("user")
})
