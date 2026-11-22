/// <reference types="vite/client" />

import { convexTest } from "convex-test"
import { describe, expect, it, vi } from "vitest"
import type { ActionCtx } from "../convex/_generated/server.js"
import { internal } from "../convex/_generated/api.js"
import schema from "../convex/schema.js"
import { hierarchyDeleteWorkerDurableStepFn } from "../src/hierarchy_delete/convex/hierarchyDeleteWorkerDurableStepFn.ts"
import { hierarchyDeleteWorkerScheduleFn } from "../src/hierarchy_delete/convex/hierarchyDeleteWorkerScheduleFn.ts"

const modules = import.meta.glob("../convex/**/*.ts")

async function fixture() {
  const t = convexTest(schema, modules)
  const jobId = await t.run(async (ctx) =>
    ctx.db.insert("hierarchyDeleteJobs", {
      rootKind: "note",
      rootId: "note-1",
      fingerprint: "fingerprint",
      status: "pending",
      phase: "delete_r2_objects",
      cursor: 0,
      requestedByUserId: "user-1",
      counts: { orgs: 0, teams: 0, projects: 0, notes: 1, resources: 0, files: 0, total: 1 },
      scope: { orgIds: [], teamIds: [], projectIds: [], noteIds: ["note-1"], resourceIds: [], fileIds: [] },
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    }),
  )
  return { t, jobId }
}

describe("hierarchy deletion watchdog", () => {
  it("reports the original and persistence failures when Convex calls are unavailable", async () => {
    const runMutation = vi.fn().mockRejectedValue(new Error("fetch failed"))
    const result = await hierarchyDeleteWorkerDurableStepFn({ runMutation } as unknown as ActionCtx, {
      jobId: "job-1",
      expectedPhase: "delete_r2_objects",
      expectedCursor: 0,
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.errorMessage).toContain("persistence threw: fetch failed")
    expect(runMutation).toHaveBeenCalledTimes(2)
  })

  it("marks a stalled worker as failed and retryable", async () => {
    const { t, jobId } = await fixture()
    await t.run(async (ctx) => hierarchyDeleteWorkerScheduleFn(ctx, jobId, "delete_r2_objects", 0))
    await t.mutation(internal.hierarchyDelete.hierarchyDeleteWorkerWatchdogInternalMutation, { jobId, generation: 1 })
    const job = await t.run(async (ctx) => ctx.db.get(jobId))
    expect(job?.status).toBe("failed")
    expect(job?.isRetryable).toBe(true)
    expect(job?.error).toContain("Please retry")
    expect(job?.phase).toBe("delete_r2_objects")
    expect(job?.cursor).toBe(0)
  })

  it("ignores old generations and completed jobs", async () => {
    const { t, jobId } = await fixture()
    await t.run(async (ctx) => {
      await hierarchyDeleteWorkerScheduleFn(ctx, jobId, "delete_r2_objects", 0)
      await hierarchyDeleteWorkerScheduleFn(ctx, jobId, "delete_r2_objects", 0)
    })
    await t.mutation(internal.hierarchyDelete.hierarchyDeleteWorkerWatchdogInternalMutation, { jobId, generation: 1 })
    expect((await t.run(async (ctx) => ctx.db.get(jobId)))?.status).toBe("pending")
    await t.run(async (ctx) => ctx.db.patch(jobId, { status: "completed" }))
    await t.mutation(internal.hierarchyDelete.hierarchyDeleteWorkerWatchdogInternalMutation, { jobId, generation: 2 })
    expect((await t.run(async (ctx) => ctx.db.get(jobId)))?.status).toBe("completed")
  })
})
