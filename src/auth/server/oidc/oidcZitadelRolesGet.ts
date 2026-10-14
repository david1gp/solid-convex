import { type UserRole, userRole } from "#src/auth/model_field/userRole.ts"
import type { OidcIdTokenClaims } from "#src/auth/server/oidc/oidcIdTokenClaimsSchema.ts"

const canonicalRoles: readonly UserRole[] = [userRole.admin, userRole.member, userRole.user]

export function oidcZitadelRolesGet(
  projectRoles: OidcIdTokenClaims["urn:zitadel:iam:org:project:roles"],
  organizationId: string | undefined,
): UserRole[] | undefined {
  if (!organizationId) return undefined
  if (!projectRoles) return []
  const roleGrantsList = Array.isArray(projectRoles) ? projectRoles : [projectRoles]
  const verifiedRoles: UserRole[] = []
  for (const role of canonicalRoles) {
    const hasGrant = roleGrantsList.some((roleGrant) => {
      const orgGrants = roleGrant[role]
      return Boolean(orgGrants && Object.hasOwn(orgGrants, organizationId))
    })
    if (hasGrant) {
      verifiedRoles.push(role)
    }
  }
  return verifiedRoles
}
