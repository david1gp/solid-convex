import type { Transport } from "@connectrpc/connect"
import type { PromiseResult } from "#result"
import { createResult, createResultError } from "#result"
import type { UserRole } from "#src/auth/model_field/userRole.ts"
import type { ZitadelUserAssignmentPartialFailure } from "#src/user_management/server/ZitadelUserAssignmentPartialFailure.ts"
import type { ZitadelUserAssignmentSaveResult } from "#src/user_management/server/ZitadelUserAssignmentSaveResult.ts"
import type { ZitadelServerConfig } from "#src/user_management/server/zitadelServerConfigSchema.ts"
import { zitadelUserRolesSave } from "#src/user_management/server/zitadelUserRolesSave.ts"
import { zitadelUserTeamIdsSave } from "#src/user_management/server/zitadelUserTeamIdsSave.ts"

interface ZitadelUserAssignmentSaveOptions {
  readonly config: ZitadelServerConfig
  readonly userId: string
  readonly roles?: readonly UserRole[]
  readonly teamIds?: readonly string[]
  readonly existingGrant?: {
    readonly id: string
    readonly roleKeys: readonly string[]
  }
  readonly transport?: Transport
  readonly fetch?: (input: string | URL | Request, init?: RequestInit) => Promise<Response>
}

export async function zitadelUserAssignmentSave(
  options: ZitadelUserAssignmentSaveOptions,
): PromiseResult<ZitadelUserAssignmentSaveResult> {
  const op = "zitadelUserAssignmentSave"

  if (options.roles === undefined && options.teamIds === undefined) {
    return createResult({
      userId: options.userId,
      rolesUpdated: false,
      teamIdsUpdated: false,
    })
  }

  if (options.roles !== undefined && options.teamIds === undefined) {
    const rolesResult = await zitadelUserRolesSave({
      config: options.config,
      userId: options.userId,
      roles: options.roles,
      existingGrant: options.existingGrant,
      fetch: options.fetch,
    })

    if (!rolesResult.success) {
      const rawError: ZitadelUserAssignmentPartialFailure = {
        userId: options.userId,
        rolesUpdated: false,
        teamIdsUpdated: false,
        rolesError: rolesResult.errorMessage,
      }
      return createResultError(op, rolesResult.errorMessage, JSON.stringify(rawError))
    }

    return createResult({
      userId: options.userId,
      rolesUpdated: true,
      teamIdsUpdated: false,
      roleKeys: rolesResult.data.roleKeys,
    })
  }

  if (options.roles === undefined && options.teamIds !== undefined) {
    const teamIdsResult = await zitadelUserTeamIdsSave({
      config: options.config,
      userId: options.userId,
      teamIds: options.teamIds,
      transport: options.transport,
    })

    if (!teamIdsResult.success) {
      const rawError: ZitadelUserAssignmentPartialFailure = {
        userId: options.userId,
        rolesUpdated: false,
        teamIdsUpdated: false,
        teamIdsError: teamIdsResult.errorMessage,
      }
      return createResultError(op, teamIdsResult.errorMessage, JSON.stringify(rawError))
    }

    return createResult({
      userId: options.userId,
      rolesUpdated: false,
      teamIdsUpdated: true,
      teamIds: teamIdsResult.data.teamIds,
    })
  }

  // Both roles and teamIds are provided
  const rolesResult = await zitadelUserRolesSave({
    config: options.config,
    userId: options.userId,
    roles: options.roles as readonly UserRole[],
    existingGrant: options.existingGrant,
    fetch: options.fetch,
  })

  const teamIdsResult = await zitadelUserTeamIdsSave({
    config: options.config,
    userId: options.userId,
    teamIds: options.teamIds as readonly string[],
    transport: options.transport,
  })

  if (rolesResult.success && teamIdsResult.success) {
    return createResult({
      userId: options.userId,
      rolesUpdated: true,
      teamIdsUpdated: true,
      roleKeys: rolesResult.data.roleKeys,
      teamIds: teamIdsResult.data.teamIds,
    })
  }

  const rolesError = rolesResult.success ? undefined : rolesResult.errorMessage
  const teamIdsError = teamIdsResult.success ? undefined : teamIdsResult.errorMessage

  if (rolesResult.success && !teamIdsResult.success) {
    const rawError: ZitadelUserAssignmentPartialFailure = {
      userId: options.userId,
      rolesUpdated: true,
      teamIdsUpdated: false,
      roleKeys: rolesResult.data.roleKeys,
      teamIdsError,
    }
    return createResultError(
      op,
      `Partial write failure: user role grant updated successfully, but team IDs metadata save failed: ${teamIdsError}`,
      JSON.stringify(rawError),
    )
  }

  if (!rolesResult.success && teamIdsResult.success) {
    const rawError: ZitadelUserAssignmentPartialFailure = {
      userId: options.userId,
      rolesUpdated: false,
      teamIdsUpdated: true,
      teamIds: teamIdsResult.data.teamIds,
      rolesError,
    }
    return createResultError(
      op,
      `Partial write failure: team IDs metadata saved successfully, but user role grant update failed: ${rolesError}`,
      JSON.stringify(rawError),
    )
  }

  const rawError: ZitadelUserAssignmentPartialFailure = {
    userId: options.userId,
    rolesUpdated: false,
    teamIdsUpdated: false,
    rolesError,
    teamIdsError,
  }
  return createResultError(
    op,
    `Failed to save user assignments: roles failed (${rolesError}), team IDs failed (${teamIdsError})`,
    JSON.stringify(rawError),
  )
}
