import { type UserRole, userRole } from "#src/auth/model_field/userRole.ts"

export function userRoleEffectiveGet(roles: readonly UserRole[] | undefined | null): UserRole {
  if (!roles || roles.length === 0) return userRole.user
  if (roles.includes(userRole.admin)) return userRole.admin
  if (roles.includes(userRole.member)) return userRole.member
  return userRole.user
}
