import { UserService } from "@adaptive-ds/zitadel-cli"
import { zitadelTransportCreate } from "@adaptive-ds/zitadel-cli/transport"
import type { Transport } from "@connectrpc/connect"
import { createClient } from "@connectrpc/connect"
import type { PromiseResult } from "#result"
import { createResult, createResultError } from "#result"
import type { ZitadelServerConfig } from "#src/user_management/server/zitadelServerConfigSchema.ts"

export interface ZitadelUserMetadataEntry {
  readonly key: string
  readonly value: Uint8Array
}

export interface ZitadelUserMetadataListOptions {
  readonly config: ZitadelServerConfig
  readonly userId: string
  readonly transport?: Transport
}

export async function zitadelUserMetadataList(
  options: ZitadelUserMetadataListOptions,
): PromiseResult<readonly ZitadelUserMetadataEntry[]> {
  const op = "zitadelUserMetadataList"
  const transport = options.transport ?? zitadelTransportCreate(options.config)
  const client = createClient(UserService, transport)

  try {
    const response = await client.listUserMetadata({
      userId: options.userId,
    })

    const entries: ZitadelUserMetadataEntry[] = (response.metadata ?? []).map((entry) => ({
      key: entry.key,
      value: entry.value,
    }))

    return createResult(entries)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return createResultError(op, `Failed to list user metadata for ${options.userId}: ${message}`)
  }
}
