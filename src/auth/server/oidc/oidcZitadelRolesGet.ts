import { type UserRole, userRole } from "#src/auth/model_field/userRole.ts"

const canonicalRoles: readonly UserRole[] = [userRole.admin, userRole.member, userRole.user]

export function oidcZitadelRolesGet(projectRoles: unknown, organizationId: string | undefined): UserRole[] | undefined {
  if (!organizationId) return undefined
  if (!projectRoles) return []
  const roleGrantsList = Array.isArray(projectRoles) ? projectRoles : [projectRoles]
  const verifiedRoles: UserRole[] = []
  for (const role of canonicalRoles) {
    const hasGrant = roleGrantsList.some((roleGrant) => {
      if (!roleGrant || typeof roleGrant !== "object" || Array.isArray(roleGrant)) return false
      if (!Object.hasOwn(roleGrant, role)) return false
      const orgGrants = (roleGrant as Record<string, unknown>)[role]
      return Boolean(
        orgGrants &&
          typeof orgGrants === "object" &&
          !Array.isArray(orgGrants) &&
          Object.hasOwn(orgGrants, organizationId),
      )
    })
    if (hasGrant) {
      verifiedRoles.push(role)
    }
  }
  return verifiedRoles
}
