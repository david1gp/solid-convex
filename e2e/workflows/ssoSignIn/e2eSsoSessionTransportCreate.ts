import { createHash } from "node:crypto"
import * as v from "valibot"
import { createResult, createResultError, type Result } from "#result"
import type { E2eSsoSessionObservation } from "./e2eSsoSessionObservationSchema.ts"

const pageSchema = v.object({
  status: v.literal("success"),
  value: v.object({
    isDone: v.boolean(),
    continueCursor: v.string(),
    page: v.array(
      v.object({
        _id: v.string(),
        _creationTime: v.number(),
        userId: v.string(),
        token: v.string(),
        createdAt: v.string(),
        e2eRunId: v.optional(v.string()),
        e2eOwnedAt: v.optional(v.number()),
      }),
    ),
  }),
})

/** Existing Convex CLI's read-only, cursor-paginated table API. No backend deployment needed. */
export function e2eSsoSessionTransportCreate(config: { backendUrl: string; adminKey: string; fetch?: typeof fetch }) {
  return async (): Promise<Result<E2eSsoSessionObservation[]>> => {
    const op = "e2eSsoSessionTransportCreate"
    const sessions: E2eSsoSessionObservation[] = []
    const seenCursors = new Set<string>()
    let cursor: string | null = null
    for (let pageIndex = 0; pageIndex < 1000; pageIndex++) {
      let raw: unknown
      try {
        const response = await (config.fetch ?? fetch)(`${config.backendUrl}/api/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Convex ${config.adminKey}` },
          body: JSON.stringify({
            path: "_system/cli/tableData",
            format: "convex_encoded_json",
            args: [
              {
                table: "authSessions",
                order: "asc",
                paginationOpts: { cursor, numItems: 100 },
              },
            ],
          }),
        })
        if (!response.ok) return createResultError(op, `Session reconciliation HTTP ${response.status}`)
        raw = await response.json()
      } catch {
        return createResultError(op, "Session reconciliation request failed")
      }
      const parsed = v.safeParse(pageSchema, raw)
      // Never include the API body/issues: it contains credentials belonging to shared sessions.
      if (!parsed.success) return createResultError(op, "Invalid session reconciliation response")
      for (const row of parsed.output.value.page)
        sessions.push({
          sessionId: row._id,
          userId: row.userId,
          createdAt: row.createdAt,
          creationTime: row._creationTime,
          tokenDigest: createHash("sha256").update(row.token).digest("hex"),
          ...(row.e2eRunId !== undefined ? { e2eRunId: row.e2eRunId } : {}),
          ...(row.e2eOwnedAt !== undefined ? { ownedAt: row.e2eOwnedAt } : {}),
        })
      if (parsed.output.value.isDone) return createResult(sessions)
      const nextCursor = parsed.output.value.continueCursor
      if (!nextCursor || seenCursors.has(nextCursor)) return createResultError(op, "Session pagination did not advance")
      seenCursors.add(nextCursor)
      cursor = nextCursor
    }
    return createResultError(op, "Session pagination exceeded reconciliation limit")
  }
}
