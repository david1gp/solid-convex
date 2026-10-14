import { UserService } from "@adaptive-ds/zitadel-cli"
import { zitadelTransportCreate } from "@adaptive-ds/zitadel-cli/transport"
import type { Transport } from "@connectrpc/connect"
import { createClient } from "@connectrpc/connect"
import type { PromiseResult } from "#result"
import { createResult, createResultError } from "#result"
import type { ZitadelServerConfig } from "#src/user_management/server/zitadelServerConfigSchema.ts"
import type { ZitadelUserSummary } from "#src/user_management/server/zitadelUserSummarySchema.ts"

export interface ZitadelUserGetOptions {
  readonly config: ZitadelServerConfig
  readonly userId: string
  readonly organizationId?: string
  readonly transport?: Transport
}

export async function zitadelUserGet(options: ZitadelUserGetOptions): PromiseResult<ZitadelUserSummary> {
  const op = "zitadelUserGet"
  const transport = options.transport ?? zitadelTransportCreate(options.config)
  const client = createClient(UserService, transport)
  const targetOrgId = options.organizationId ?? options.config.organizationId

  try {
    const response = await client.getUserByID({ userId: options.userId })
    const u = response.user
    if (!u) {
      return createResultError(op, `User not found in Zitadel: ${options.userId}`)
    }

    const userOrgId = u.details?.resourceOwner
    if (userOrgId !== undefined && userOrgId !== "" && userOrgId !== targetOrgId) {
      return createResultError(
        op,
        `User ${options.userId} belongs to organization ${userOrgId}, not target organization ${targetOrgId}`,
      )
    }

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

    return createResult({
      id: u.userId,
      username: u.username || undefined,
      preferredLoginName: u.preferredLoginName || undefined,
      displayName,
      email,
      state: u.state,
      isHuman,
    })
  } catch (_error) {
    // Fallback: query user scoped to target organization via listUsers
    try {
      const listResponse = await client.listUsers({
        query: { limit: 1 },
        queries: [
          {
            query: {
              case: "inUserIdsQuery",
              value: { userIds: [options.userId] },
            },
          },
          {
            query: {
              case: "organizationIdQuery",
              value: { organizationId: targetOrgId },
            },
          },
        ],
      })

      const matchedUser = listResponse.result?.find((u) => u.userId === options.userId)
      if (!matchedUser) {
        return createResultError(op, `User ${options.userId} not found in target organization ${targetOrgId}`)
      }

      let displayName: string | undefined = matchedUser.preferredLoginName || matchedUser.username || undefined
      let email: string | undefined
      let isHuman = false

      if (matchedUser.type?.case === "human") {
        isHuman = true
        displayName = matchedUser.type.value.profile?.displayName || displayName
        email = matchedUser.type.value.email?.email || undefined
      } else if (matchedUser.type?.case === "machine") {
        displayName = matchedUser.type.value.name || displayName
      }

      return createResult({
        id: matchedUser.userId,
        username: matchedUser.username || undefined,
        preferredLoginName: matchedUser.preferredLoginName || undefined,
        displayName,
        email,
        state: matchedUser.state,
        isHuman,
      })
    } catch (listError) {
      const message = listError instanceof Error ? listError.message : String(listError)
      return createResultError(op, `Failed to verify user ${options.userId} in target organization: ${message}`)
    }
  }
}
