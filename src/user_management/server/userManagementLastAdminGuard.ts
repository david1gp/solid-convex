import type { Result } from "#result"
import { createResult, createResultError } from "#result"
import { userRole } from "#src/auth/model_field/userRole.ts"

export interface UserManagementGrantLike {
  readonly userId: string
  readonly projectId: string
  readonly roleKeys: readonly string[]
  /** Zitadel user-grant state: 1 is active. */
  readonly state: number
}

/**
 * Fail-closed guard for role removal: refuses to drop the `admin` role from
 * the last remaining project admin. Grants that fail to load also refuse,
 * never silently orphan the project.
 */
export function userManagementLastAdminGuard(options: {
  readonly grants: readonly UserManagementGrantLike[]
  readonly targetUserId: string
  readonly projectId: string
  readonly desiredRoles: readonly string[]
}): Result<undefined> {
  const op = "userManagementLastAdminGuard"
  if (options.desiredRoles.includes(userRole.admin)) {
    return createResult(undefined)
  }
  const targetHadActiveAdmin = options.grants.some(
    (grant) =>
      grant.userId === options.targetUserId &&
      grant.projectId === options.projectId &&
      grant.state === 1 &&
      grant.roleKeys.includes(userRole.admin),
  )
  if (!targetHadActiveAdmin) {
    return createResult(undefined)
  }
  const anotherActiveAdminExists = options.grants.some(
    (grant) =>
      grant.userId !== options.targetUserId &&
      grant.projectId === options.projectId &&
      grant.state === 1 &&
      grant.roleKeys.includes(userRole.admin),
  )
  if (!anotherActiveAdminExists) {
    return createResultError(op, "The last admin role cannot be removed")
  }
  return createResult(undefined)
}
