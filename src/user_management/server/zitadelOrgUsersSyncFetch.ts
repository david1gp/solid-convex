import type { Transport } from "@connectrpc/connect"
import type { PromiseResult } from "#result"
import { createResult, createResultError } from "#result"
import type { UserProjection } from "#src/user_management/model/userProjectionSchema.ts"
import type { ZitadelServerConfig } from "#src/user_management/server/zitadelServerConfigSchema.ts"
import { type ZitadelUserGrantItem, zitadelUserGrantList } from "#src/user_management/server/zitadelUserGrantList.ts"
import {
  type ZitadelUserListPagedResult,
  zitadelUserListPaged,
} from "#src/user_management/server/zitadelUserListPaged.ts"
import type { ZitadelUserSummary } from "#src/user_management/server/zitadelUserSummarySchema.ts"
import { zitadelUserTeamIdsGet } from "#src/user_management/server/zitadelUserTeamIdsGet.ts"

export interface ZitadelOrgUsersSyncFetchOptions {
  readonly config: ZitadelServerConfig
  readonly organizationId?: string
  readonly transport?: Transport
  readonly fetch?: (input: string | URL | Request, init?: RequestInit) => Promise<Response>
  readonly pageSize?: number
  readonly maxPages?: number
}

export interface ZitadelOrgUsersSyncFetchResult {
  readonly records: readonly UserProjection[]
  readonly totalCount: number
  readonly isComplete: boolean
}

export async function zitadelOrgUsersSyncFetch(
  options: ZitadelOrgUsersSyncFetchOptions,
): PromiseResult<ZitadelOrgUsersSyncFetchResult> {
  const op = "zitadelOrgUsersSyncFetch"
  const organizationId = options.organizationId ?? options.config.organizationId
  const pageSize = options.pageSize ?? 100
  const maxPages = options.maxPages ?? 100

  // 1. Page through users for target organization
  const allUsers: ZitadelUserSummary[] = []
  let userOffset = 0
  let totalCount = 0
  let userPagesFetched = 0

  while (userPagesFetched < maxPages) {
    const pageResult = await zitadelUserListPaged({
      config: options.config,
      organizationId,
      limit: pageSize,
      offset: userOffset,
      transport: options.transport,
    })

    if (!pageResult.success) {
      return createResultError(op, `Failed to list users from Zitadel: ${pageResult.errorMessage}`)
    }

    totalCount = pageResult.data.totalCount
    allUsers.push(...pageResult.data.users)
    userPagesFetched += 1

    if (
      pageResult.data.users.length === 0 ||
      allUsers.length >= totalCount ||
      pageResult.data.users.length < pageSize
    ) {
      break
    }
    userOffset += pageResult.data.users.length
  }

  // 2. Page through all project grants
  const allGrants: ZitadelUserGrantItem[] = []
  let grantOffset = 0
  let grantPagesFetched = 0

  while (grantPagesFetched < maxPages) {
    const grantPageResult = await zitadelUserGrantList({
      config: options.config,
      projectId: options.config.projectId,
      limit: pageSize,
      offset: grantOffset,
      fetch: options.fetch,
    })

    if (!grantPageResult.success) {
      return createResultError(op, `Failed to list project grants from Zitadel: ${grantPageResult.errorMessage}`)
    }

    allGrants.push(...grantPageResult.data)
    grantPagesFetched += 1

    if (grantPageResult.data.length < pageSize) {
      break
    }
    grantOffset += grantPageResult.data.length
  }

  const grantsByUserId = new Map<string, string[]>()
  for (const grant of allGrants) {
    const allowedRoles = grant.roleKeys.filter((k) => k === "admin" || k === "member" || k === "user")
    const current = grantsByUserId.get(grant.userId) ?? []
    grantsByUserId.set(grant.userId, [...current, ...allowedRoles])
  }

  // 3. Fetch team IDs per user; fail on error, never fabricate empty
  const syncedAt = new Date().toISOString()
  const records: UserProjection[] = []

  for (const user of allUsers) {
    const teamIdsResult = await zitadelUserTeamIdsGet({
      config: options.config,
      userId: user.id,
      transport: options.transport,
    })

    if (!teamIdsResult.success) {
      return createResultError(op, `Failed to load team IDs for user ${user.id}: ${teamIdsResult.errorMessage}`)
    }

    const roles = grantsByUserId.get(user.id) ?? []

    records.push({
      userId: user.id,
      organizationId,
      username: user.username,
      preferredLoginName: user.preferredLoginName,
      displayName: user.displayName,
      email: user.email,
      state: user.state,
      isHuman: user.isHuman,
      roles,
      teamIds: [...teamIdsResult.data],
      syncedAt,
    })
  }

  // Server-derived completeness: true only if all users were successfully retrieved
  const isComplete = totalCount >= 0 && allUsers.length === totalCount

  return createResult({
    records,
    totalCount,
    isComplete,
  })
}
