import { readFileSync } from "node:fs"
import { ConvexHttpClient } from "convex/browser"
import { parse } from "dotenv"
import * as v from "valibot"
import type { E2eCheckpoint } from "../config/e2eCheckpointSchema.ts"
import type { E2eOwnedResource } from "../config/e2eOwnedResourceSchema.ts"

const pageSchema = v.object({
  success: v.literal(true),
  data: v.object({
    page: v.array(v.object({ e2eRunId: v.pipe(v.string(), v.minLength(1)), ownedAt: v.pipe(v.number(), v.integer(), v.minValue(1)) })),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
})
const cleanupSchema = v.object({ success: v.literal(true), data: v.object({ deletedCount: v.pipe(v.number(), v.integer(), v.minValue(0)), verifiedAbsent: v.boolean() }) })
type Admin = { function: (name: string, componentPath: undefined, args: never) => Promise<unknown> }
type Ownership = { e2eRunId: string; ownedAt: number }

/** Runner-boundary callbacks throw so the runner retains its checkpoint on cleanup failure. */
export function e2eSessionCleanupCreate(options: {
  target: "production" | "dev"
  now?: () => number
  admin?: Admin
}) {
  let admin = options.admin
  function adminGet(): Admin {
    if (admin) return admin
    const environment = parse(readFileSync(options.target === "dev" ? ".env.development" : ".env.production"))
    const url = process.env.E2E_CONVEX_URL ?? environment.CONVEX_SELF_HOSTED_URL
    const key = process.env.E2E_CONVEX_ADMIN_KEY ?? environment.CONVEX_SELF_HOSTED_ADMIN_KEY
    if (!url || !key) throw new Error("Selected target requires Convex admin URL and key for session cleanup")
    const client = new ConvexHttpClient(url, { skipConvexDeploymentUrlCheck: true }) as ConvexHttpClient & {
      setAdminAuth: (key: string) => void
    }
    client.setAdminAuth(key)
    admin = client as unknown as Admin
    return admin
  }
  async function list(createdBefore: number): Promise<Ownership[]> {
    const groups = new Map<string, Ownership>()
    let cursor: string | null = null
    const seen = new Set<string>()
    for (let i = 0; i < 10000; i++) {
      const raw = await adminGet().function("auth:authSessionE2eStaleListInternalQuery", undefined, { createdBefore, paginationOpts: { cursor, numItems: 100 } } as never)
      const parsed = v.safeParse(pageSchema, raw)
      if (!parsed.success) throw new Error("Failed to list marked stale E2E sessions")
      for (const item of parsed.output.data.page) {
        if (item.ownedAt >= createdBefore) throw new Error("Stale session list returned ownership outside cutoff")
        groups.set(JSON.stringify([item.e2eRunId, item.ownedAt]), { e2eRunId: item.e2eRunId, ownedAt: item.ownedAt })
      }
      if (parsed.output.data.isDone) return [...groups.values()]
      cursor = parsed.output.data.continueCursor
      if (!cursor || seen.has(cursor)) throw new Error("Stale session pagination did not advance")
      seen.add(cursor)
    }
    throw new Error("Stale session pagination exceeded its safety bound")
  }
  async function clean(ownership: Ownership, createdBefore?: number): Promise<void> {
    for (let i = 0; i < 10000; i++) {
      const args = createdBefore === undefined ? ownership : { ...ownership, createdBefore }
      const raw = await adminGet().function("auth:authSessionE2eRunCleanupInternalMutation", undefined, args as never)
      const parsed = v.safeParse(cleanupSchema, raw)
      if (!parsed.success) throw new Error(`Failed to clean marked E2E sessions for ${ownership.e2eRunId}`)
      if (parsed.output.data.verifiedAbsent) return
      if (!parsed.output.data.deletedCount) throw new Error(`E2E session cleanup made no progress for ${ownership.e2eRunId}`)
    }
    throw new Error(`E2E session cleanup exceeded its safety bound for ${ownership.e2eRunId}`)
  }
  return {
    async cleanupResource(resource: E2eOwnedResource, checkpoint: E2eCheckpoint): Promise<void> {
      if (checkpoint.environment !== options.target || resource.resourceType !== "auth-session" || !resource.sessionProof || resource.ownerRunId !== checkpoint.runId || resource.resourceId !== `e2e-${checkpoint.runId}-session-${resource.sessionProof.sessionId}`)
        throw new Error("Refusing cleanup of unverified E2E session")
      await clean({ e2eRunId: checkpoint.runId, ownedAt: checkpoint.createdAt })
    },
    async cleanupStale(): Promise<void> {
      const createdBefore = (options.now ?? Date.now)() - 86_400_000
      if (!Number.isSafeInteger(createdBefore) || createdBefore <= 0) throw new Error("Invalid stale session cutoff")
      const groups = await list(createdBefore)
      const errors: unknown[] = []
      for (const group of groups) {
        try { await clean(group, createdBefore) } catch (error) { errors.push(error) }
      }
      try {
        if ((await list(createdBefore)).length) errors.push(new Error("Marked stale E2E sessions remain after cleanup"))
      } catch (error) { errors.push(error) }
      if (errors.length) throw new AggregateError(errors, "Stale E2E session cleanup failed")
    },
  }
}
