import type { Transport } from "@connectrpc/connect"
import type { PromiseResult } from "#result"
import { createResult, createResultError } from "#result"
import type { ZitadelServerConfig } from "#src/user_management/server/zitadelServerConfigSchema.ts"
import { zitadelUserListPaged } from "#src/user_management/server/zitadelUserListPaged.ts"
import { zitadelUserTeamIdsGet } from "#src/user_management/server/zitadelUserTeamIdsGet.ts"
import { zitadelUserTeamIdsSave } from "#src/user_management/server/zitadelUserTeamIdsSave.ts"

export interface ZitadelUserCleanupError {
  readonly userId: string
  readonly message: string
  readonly retryable: boolean
}

export interface ZitadelUserCleanupUserUpdate {
  readonly userId: string
  readonly previousTeamIds: readonly string[]
  readonly newTeamIds: readonly string[]
}

export interface ZitadelUserDeletedTeamIdsCleanupOptions {
  readonly config: ZitadelServerConfig
  readonly deletedTeamIds: readonly string[]
  readonly organizationId?: string
  readonly limit?: number
  readonly offset?: number
  readonly cursor?: string
  readonly transport?: Transport
  readonly onUserUpdated?: (update: ZitadelUserCleanupUserUpdate) => Promise<void>
}

export interface ZitadelUserDeletedTeamIdsCleanupResult {
  readonly processedCount: number
  readonly updatedUsers: readonly ZitadelUserCleanupUserUpdate[]
  readonly skippedUserIds: readonly string[]
  readonly totalCount: number
  readonly nextCursor: string | null
  readonly nextOffset: number | null
  readonly hasMore: boolean
  readonly errors: readonly ZitadelUserCleanupError[]
}

export async function zitadelUserDeletedTeamIdsCleanup(
  options: ZitadelUserDeletedTeamIdsCleanupOptions,
): PromiseResult<ZitadelUserDeletedTeamIdsCleanupResult> {
  const op = "zitadelUserDeletedTeamIdsCleanup"

  const deletedTeamSet = new Set(options.deletedTeamIds)
  if (deletedTeamSet.size === 0) {
    return createResult({
      processedCount: 0,
      updatedUsers: [],
      skippedUserIds: [],
      totalCount: 0,
      nextCursor: null,
      nextOffset: null,
      hasMore: false,
      errors: [],
    })
  }

  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100)
  const offset = options.offset ?? (options.cursor ? Number.parseInt(options.cursor, 10) || 0 : 0)
  const organizationId = options.organizationId ?? options.config.organizationId

  const listResult = await zitadelUserListPaged({
    config: options.config,
    organizationId,
    limit,
    offset,
    transport: options.transport,
  })

  if (!listResult.success) {
    return createResultError(op, `Failed to page users for team cleanup: ${listResult.errorMessage}`)
  }

  const { users, totalCount } = listResult.data
  const updatedUsers: ZitadelUserCleanupUserUpdate[] = []
  const skippedUserIds: string[] = []
  const errors: ZitadelUserCleanupError[] = []

  for (const user of users) {
    const teamIdsResult = await zitadelUserTeamIdsGet({
      config: options.config,
      userId: user.id,
      transport: options.transport,
    })

    if (!teamIdsResult.success) {
      errors.push({
        userId: user.id,
        message: teamIdsResult.errorMessage,
        retryable: true,
      })
      continue
    }

    const currentTeamIds = teamIdsResult.data
    const filteredTeamIds = currentTeamIds.filter((id) => !deletedTeamSet.has(id))

    if (filteredTeamIds.length === currentTeamIds.length) {
      skippedUserIds.push(user.id)
      continue
    }

    const saveResult = await zitadelUserTeamIdsSave({
      config: options.config,
      userId: user.id,
      teamIds: filteredTeamIds,
      transport: options.transport,
    })

    if (!saveResult.success) {
      errors.push({
        userId: user.id,
        message: saveResult.errorMessage,
        retryable: true,
      })
      continue
    }

    const update: ZitadelUserCleanupUserUpdate = {
      userId: user.id,
      previousTeamIds: currentTeamIds,
      newTeamIds: filteredTeamIds,
    }
    updatedUsers.push(update)

    if (options.onUserUpdated) {
      try {
        await options.onUserUpdated(update)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        errors.push({
          userId: user.id,
          message: `Authority write succeeded but projection update failed: ${msg}`,
          retryable: true,
        })
      }
    }
  }

  const nextOffset = offset + users.length
  const hasMore = nextOffset < totalCount && users.length > 0
  const nextCursor = hasMore ? String(nextOffset) : null

  return createResult({
    processedCount: users.length,
    updatedUsers,
    skippedUserIds,
    totalCount,
    nextCursor,
    nextOffset: hasMore ? nextOffset : null,
    hasMore,
    errors,
  })
}
