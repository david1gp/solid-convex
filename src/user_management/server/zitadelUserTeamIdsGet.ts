import type { Transport } from "@connectrpc/connect"
import type { PromiseResult } from "#result"
import { createResult, createResultError } from "#result"
import { zitadelMetadataTeamIdsKey } from "#src/user_management/server/zitadelMetadataTeamIdsKey.ts"
import type { ZitadelServerConfig } from "#src/user_management/server/zitadelServerConfigSchema.ts"
import { zitadelUserMetadataList } from "#src/user_management/server/zitadelUserMetadataList.ts"
import { zitadelUserTeamIdsDecode } from "#src/user_management/server/zitadelUserTeamIdsDecode.ts"

export interface ZitadelUserTeamIdsGetOptions {
  readonly config: ZitadelServerConfig
  readonly userId: string
  readonly transport?: Transport
}

export async function zitadelUserTeamIdsGet(options: ZitadelUserTeamIdsGetOptions): PromiseResult<readonly string[]> {
  const op = "zitadelUserTeamIdsGet"
  const metadataResult = await zitadelUserMetadataList({
    config: options.config,
    userId: options.userId,
    transport: options.transport,
  })

  if (!metadataResult.success) {
    return createResultError(op, metadataResult.errorMessage)
  }

  const teamIdsEntry = metadataResult.data.find((entry) => entry.key === zitadelMetadataTeamIdsKey)
  if (!teamIdsEntry) {
    return createResult([])
  }

  const decodeResult = zitadelUserTeamIdsDecode(teamIdsEntry.value)
  if (!decodeResult.success) {
    return createResultError(op, `Failed to decode user teamIds metadata: ${decodeResult.errorMessage}`)
  }

  return createResult(decodeResult.data)
}
