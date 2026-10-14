import * as v from "valibot"
import type { Result } from "#result"
import { createResult, createResultError } from "#result"

const teamIdsArraySchema = v.array(v.string())

export function zitadelUserTeamIdsDecode(raw: Uint8Array | string | undefined | null): Result<readonly string[]> {
  const op = "zitadelUserTeamIdsDecode"

  if (raw === undefined || raw === null) {
    return createResult([])
  }

  let text = ""
  if (raw instanceof Uint8Array) {
    if (raw.length === 0) {
      return createResult([])
    }
    text = new TextDecoder().decode(raw).trim()
  } else if (typeof raw === "string") {
    text = raw.trim()
  } else {
    return createResultError(op, "Invalid raw teamIds metadata input type", raw)
  }

  if (text === "") {
    return createResult([])
  }

  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(text)
  } catch {
    try {
      const decodedBase64 = Buffer.from(text, "base64").toString("utf-8")
      parsedJson = JSON.parse(decodedBase64)
    } catch {
      return createResultError(op, "Failed to parse teamIds metadata JSON or base64 JSON", text)
    }
  }

  const parseResult = v.safeParse(teamIdsArraySchema, parsedJson)
  if (!parseResult.success) {
    return createResultError(
      op,
      `Invalid teamIds array schema: ${v.summarize(parseResult.issues)}`,
      JSON.stringify(parsedJson),
    )
  }

  return createResult(parseResult.output)
}
