import {
  type UserGrant,
  type UserGrantSearchQuery,
  userGrantServiceListUserGrants,
} from "@adaptive-ds/zitadel-cli/legacy_v1"
import type { PromiseResult } from "#result"
import { createResult, createResultError } from "#result"
import type { ZitadelServerConfig } from "#src/user_management/server/zitadelServerConfigSchema.ts"

export interface ZitadelUserGrantItem {
  readonly id: string
  readonly orgId: string
  readonly projectId: string
  readonly roleKeys: readonly string[]
  readonly state: number
  readonly userId: string
}

export interface ZitadelUserGrantListOptions {
  readonly config: ZitadelServerConfig
  readonly projectId?: string
  readonly userId?: string
  readonly limit?: number
  readonly offset?: number
  readonly fetch?: (input: string | URL | Request, init?: RequestInit) => Promise<Response>
}

export async function zitadelUserGrantList(
  options: ZitadelUserGrantListOptions,
): PromiseResult<readonly ZitadelUserGrantItem[]> {
  const op = "zitadelUserGrantList"
  const projectId = options.projectId ?? options.config.projectId
  const limit = options.limit ?? 100
  const offset = options.offset ?? 0

  const queries: UserGrantSearchQuery[] = [{ projectIdQuery: { projectId } }]
  if (options.userId !== undefined) {
    queries.push({ userIdQuery: { userId: options.userId } })
  }

  const result = await userGrantServiceListUserGrants({
    config: {
      baseUrl: options.config.baseUrl,
      token: options.config.token,
      organizationId: options.config.organizationId,
      projectId: options.config.projectId,
    },
    request: {
      queries,
      query: {
        asc: true,
        limit,
        offset,
      },
    },
    fetch: options.fetch,
  })

  if (!result.success) {
    return createResultError(op, `Failed to list user grants: ${result.errorMessage}`)
  }

  const items: ZitadelUserGrantItem[] = result.data.result.map((g: UserGrant) => ({
    id: g.id,
    orgId: g.orgId,
    projectId: g.projectId,
    roleKeys: g.roleKeys,
    state: g.state,
    userId: g.userId,
  }))

  return createResult(items)
}
