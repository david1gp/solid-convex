import { UserService } from "@adaptive-ds/zitadel-cli"
import { zitadelTransportCreate } from "@adaptive-ds/zitadel-cli/transport"
import type { Transport } from "@connectrpc/connect"
import { createClient } from "@connectrpc/connect"
import type { PromiseResult } from "#result"
import { createResult, createResultError } from "#result"
import { zitadelMetadataTeamIdsKey } from "#src/user_management/server/zitadelMetadataTeamIdsKey.ts"
import type { ZitadelServerConfig } from "#src/user_management/server/zitadelServerConfigSchema.ts"
import { zitadelUserTeamIdsEncode } from "#src/user_management/server/zitadelUserTeamIdsEncode.ts"

export interface ZitadelUserTeamIdsSaveOptions {
  readonly config: ZitadelServerConfig
  readonly userId: string
  readonly teamIds: readonly string[]
  readonly transport?: Transport
}

export interface ZitadelUserTeamIdsSaveResult {
  readonly teamIds: readonly string[]
}

export async function zitadelUserTeamIdsSave(
  options: ZitadelUserTeamIdsSaveOptions,
): PromiseResult<ZitadelUserTeamIdsSaveResult> {
  const op = "zitadelUserTeamIdsSave"
  const transport = options.transport ?? zitadelTransportCreate(options.config)
  const client = createClient(UserService, transport)

  const encodedBytes = zitadelUserTeamIdsEncode(options.teamIds)

  try {
    await client.setUserMetadata({
      userId: options.userId,
      metadata: [
        {
          key: zitadelMetadataTeamIdsKey,
          value: encodedBytes,
        },
      ],
    })

    return createResult({
      teamIds: options.teamIds,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return createResultError(op, `Failed to save user team metadata for ${options.userId}: ${message}`)
  }
}
