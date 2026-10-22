import { type UserRole, userRole } from "#src/auth/model_field/userRole.ts"

/**
 * Roles offered in the member edit dialog: generic base roles `admin` and
 * `user`, plus every other role already present in this project.
 */
export function userAvailableRolesRead(
  members: readonly { readonly roles: readonly string[] }[],
): readonly ["admin", "user", ...string[]] {
  const extras: string[] = []
  for (const member of members) {
    for (const role of member.roles) {
      if (role === userRole.admin || role === userRole.user || extras.includes(role)) continue
      extras.push(role)
    }
  }
  extras.sort()
  return [userRole.admin, userRole.user, ...extras]
}

export type UserAvailableRoleFilter = "all" | string

/**
 * Role filter for the member list: `all` shows members with at least one
 * role, any other value narrows to members holding that role.
 */
export function userManagementMembersFilter<TMember extends { readonly roles: readonly string[] }>(
  members: readonly TMember[],
  filter: UserAvailableRoleFilter,
): readonly TMember[] {
  if (filter === "all") {
    return members.filter((member) => member.roles.length > 0)
  }
  return members.filter((member) => member.roles.includes(filter))
}

export function userRoleFilterOptionsGet(
  members: readonly { readonly roles: readonly string[] }[],
): readonly ["all", ...string[]] {
  return ["all", ...userAvailableRolesRead(members)]
}

export type { UserRole }
