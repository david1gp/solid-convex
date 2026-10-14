import type { UserRole } from "#src/auth/model_field/userRole.ts"
import { userRoleEffectiveGet } from "#src/auth/model_field/userRoleEffectiveGet.ts"
import { oidcZitadelRolesGet } from "#src/auth/server/oidc/oidcZitadelRolesGet.ts"

export function oidcZitadelRoleGet(projectRoles: unknown, organizationId: string | undefined): UserRole | undefined {
  const verifiedRoles = oidcZitadelRolesGet(projectRoles, organizationId)
  if (verifiedRoles === undefined) return undefined
  return userRoleEffectiveGet(verifiedRoles)
}
