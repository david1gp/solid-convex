import * as a from "valibot"

export type UserRole = keyof typeof userRole

export const userRole = {
  user: "user",
  member: "member",
  admin: "admin",
} as const

export const userRoleSchema = a.enum(userRole)

export function userRoleIsAdmin(r: UserRole): boolean {
  return r === userRole.admin
}
