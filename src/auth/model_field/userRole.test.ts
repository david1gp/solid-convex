import { expect, test } from "bun:test"
import * as a from "valibot"
import { userRole, userRoleIsAdmin, userRoleSchema } from "#src/auth/model_field/userRole.ts"

test("the canonical role model contains only user, member, and admin", () => {
  expect(userRole).toEqual({ user: "user", member: "member", admin: "admin" })
  expect(a.safeParse(userRoleSchema, "user").success).toBe(true)
  expect(a.safeParse(userRoleSchema, "member").success).toBe(true)
  expect(a.safeParse(userRoleSchema, "admin").success).toBe(true)
  expect(a.safeParse(userRoleSchema, "dev").success).toBe(false)
})

test("admin is the only elevated role", () => {
  expect(userRoleIsAdmin(userRole.admin)).toBe(true)
  expect(userRoleIsAdmin(userRole.member)).toBe(false)
  expect(userRoleIsAdmin(userRole.user)).toBe(false)
})
