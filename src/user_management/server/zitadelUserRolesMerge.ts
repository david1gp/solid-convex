import { type UserRole, userRole } from "#src/auth/model_field/userRole.ts"

const canonicalRoleSet = new Set<string>([userRole.user, userRole.member, userRole.admin])

export function zitadelUserRolesMerge(
  existingRoleKeys: readonly string[],
  desiredCanonicalRoles: readonly UserRole[],
): readonly string[] {
  const preservedUnknownRoles = existingRoleKeys.filter((role) => !canonicalRoleSet.has(role))
  const merged = [...preservedUnknownRoles, ...desiredCanonicalRoles]
  return Array.from(new Set(merged))
}
