import {
  userGrantServiceAddUserGrant,
  userGrantServiceReactivateUserGrant,
  userGrantServiceUpdateUserGrant,
} from "@adaptive-ds/zitadel-cli/legacy_v1"
import type { PromiseResult } from "#result"
import { createResult, createResultError } from "#result"
import type { UserRole } from "#src/auth/model_field/userRole.ts"
import type { ZitadelServerConfig } from "#src/user_management/server/zitadelServerConfigSchema.ts"
import { zitadelUserGrantList } from "#src/user_management/server/zitadelUserGrantList.ts"
import { zitadelUserRolesMerge } from "#src/user_management/server/zitadelUserRolesMerge.ts"

export interface ZitadelUserRolesSaveOptions {
  readonly config: ZitadelServerConfig
  readonly userId: string
  readonly roles: readonly UserRole[]
  readonly existingGrant?: {
    readonly id: string
    readonly roleKeys: readonly string[]
    readonly state?: number
  }
  readonly fetch?: (input: string | URL | Request, init?: RequestInit) => Promise<Response>
}

export interface ZitadelUserRolesSaveResult {
  readonly grantId?: string
  readonly roleKeys: readonly string[]
}

export async function zitadelUserRolesSave(
  options: ZitadelUserRolesSaveOptions,
): PromiseResult<ZitadelUserRolesSaveResult> {
  const op = "zitadelUserRolesSave"
  let grantId = options.existingGrant?.id
  let existingRoleKeys = options.existingGrant?.roleKeys
  let existingGrantState = options.existingGrant?.state

  if (options.existingGrant === undefined) {
    const listResult = await zitadelUserGrantList({
      config: options.config,
      userId: options.userId,
      projectId: options.config.projectId,
      fetch: options.fetch,
    })

    if (!listResult.success) {
      return createResultError(op, `Failed to inspect existing user grants: ${listResult.errorMessage}`)
    }

    const currentGrant = listResult.data.find(
      (grant) => grant.userId === options.userId && grant.projectId === options.config.projectId,
    )
    if (currentGrant !== undefined) {
      grantId = currentGrant.id
      existingRoleKeys = currentGrant.roleKeys
      existingGrantState = currentGrant.state
    }
  }

  const mergedRoleKeys = zitadelUserRolesMerge(existingRoleKeys ?? [], options.roles)

  const legacyConfig = {
    baseUrl: options.config.baseUrl,
    token: options.config.token,
    organizationId: options.config.organizationId,
    projectId: options.config.projectId,
  }

  if (grantId !== undefined) {
    if (existingGrantState === undefined || existingGrantState === 1 || existingGrantState === 0) {
      if (
        existingRoleKeys !== undefined &&
        mergedRoleKeys.length === existingRoleKeys.length &&
        mergedRoleKeys.every((roleKey, index) => roleKey === existingRoleKeys[index])
      ) {
        return createResult({
          grantId,
          roleKeys: mergedRoleKeys,
        })
      }
    } else {
      const reactivateResult = await userGrantServiceReactivateUserGrant({
        config: legacyConfig,
        grantId,
        userId: options.userId,
        fetch: options.fetch,
      })

      if (!reactivateResult.success) {
        return createResultError(op, `Failed to reactivate user grant: ${reactivateResult.errorMessage}`)
      }
    }

    const updateResult = await userGrantServiceUpdateUserGrant({
      config: legacyConfig,
      grantId,
      userId: options.userId,
      request: { roleKeys: mergedRoleKeys },
      fetch: options.fetch,
    })

    if (!updateResult.success) {
      return createResultError(op, `Failed to update user grant: ${updateResult.errorMessage}`)
    }

    return createResult({
      grantId,
      roleKeys: mergedRoleKeys,
    })
  }

  if (mergedRoleKeys.length === 0) {
    return createResult({
      roleKeys: [],
    })
  }

  const addResult = await userGrantServiceAddUserGrant({
    config: legacyConfig,
    userId: options.userId,
    request: {
      projectId: options.config.projectId,
      roleKeys: mergedRoleKeys,
    },
    fetch: options.fetch,
  })

  if (!addResult.success) {
    return createResultError(op, `Failed to add user grant: ${addResult.errorMessage}`)
  }

  return createResult({
    roleKeys: mergedRoleKeys,
  })
}
