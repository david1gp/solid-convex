import { UserService } from "@adaptive-ds/zitadel-cli"
import { zitadelTransportCreate } from "@adaptive-ds/zitadel-cli/transport"
import type { Transport } from "@connectrpc/connect"
import { createClient } from "@connectrpc/connect"
import type { PromiseResult } from "#result"
import { createResult, createResultError } from "#result"
import type { ZitadelServerConfig } from "#src/user_management/server/zitadelServerConfigSchema.ts"
import type { ZitadelUserSummary } from "#src/user_management/server/zitadelUserSummarySchema.ts"

export interface ZitadelUserListPagedOptions {
  readonly config: ZitadelServerConfig
  readonly limit?: number
  readonly offset?: number
  readonly organizationId?: string
  readonly transport?: Transport
}

export interface ZitadelUserListPagedResult {
  readonly users: readonly ZitadelUserSummary[]
  readonly totalCount: number
}

export async function zitadelUserListPaged(
  options: ZitadelUserListPagedOptions,
): PromiseResult<ZitadelUserListPagedResult> {
  const op = "zitadelUserListPaged"
  const organizationId = options.organizationId ?? options.config.organizationId
  const limit = options.limit ?? 20
  const offset = options.offset ?? 0

  const transport = options.transport ?? zitadelTransportCreate(options.config)
  const client = createClient(UserService, transport)

  try {
    const response = await client.listUsers({
      query: {
        asc: true,
        limit,
        offset: BigInt(offset),
      },
      queries: [
        {
          query: {
            case: "organizationIdQuery",
            value: { organizationId },
          },
        },
      ],
    })

    const users: ZitadelUserSummary[] = (response.result ?? []).map((u) => {
      let displayName: string | undefined = u.preferredLoginName || u.username || undefined
      let email: string | undefined
      let isHuman = false

      if (u.type?.case === "human") {
        isHuman = true
        displayName = u.type.value.profile?.displayName || displayName
        email = u.type.value.email?.email || undefined
      } else if (u.type?.case === "machine") {
        displayName = u.type.value.name || displayName
      }

      return {
        id: u.userId,
        username: u.username || undefined,
        preferredLoginName: u.preferredLoginName || undefined,
        displayName,
        email,
        state: u.state,
        isHuman,
      }
    })

    const totalCount = Number(response.details?.totalResult ?? BigInt(users.length))

    return createResult({
      users,
      totalCount,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return createResultError(op, `Failed to list users from Zitadel: ${message}`)
  }
}
