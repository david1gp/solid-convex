import type { MutationCtx } from "#convex/_generated/server.js"
import { internal } from "#convex/_generated/api.js"
import type { Id } from "#convex/_generated/dataModel.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import { hierarchyDeleteRootLockCheckFn } from "#src/hierarchy_delete/convex/hierarchyDeleteRootLockCheckFn.ts"
import { hierarchyDeleteWorkerDbStepFn } from "#src/hierarchy_delete/convex/hierarchyDeleteWorkerDbStepFn.ts"
import type { HierarchyDeleteJobState } from "#src/hierarchy_delete/model/hierarchyDeleteJobStateSchema.ts"
import type { HierarchyDeleteWorkerPhase } from "#src/hierarchy_delete/model/hierarchyDeleteWorkerPhaseSchema.ts"
import { nowIso } from "#utils/date/nowIso.js"

export interface HierarchyDeleteWorkerDbStepDurableArgs {
  jobId: string
  expectedPhase?: string
  expectedCursor?: number
}

export async function hierarchyDeleteWorkerDbStepDurableFn(
  ctx: MutationCtx,
  args: HierarchyDeleteWorkerDbStepDurableArgs,
): PromiseResult<HierarchyDeleteJobState> {
  const op = "hierarchyDeleteWorkerDbStepDurableFn"
  const job = await ctx.db.get("hierarchyDeleteJobs", args.jobId as Id<"hierarchyDeleteJobs">)
  if (!job) {
    return createResultError(op, `Job not found: ${args.jobId}`)
  }

  const counts = {
    ...job.counts,
    orgMembers: job.counts.orgMembers ?? 0,
    orgInvitations: job.counts.orgInvitations ?? 0,
  }
  const scope = {
    ...job.scope,
    orgMemberIds: job.scope.orgMemberIds ?? [],
    orgInvitationIds: job.scope.orgInvitationIds ?? [],
  }

  if (job.status === "completed" || job.status === "failed") {
    return createResult({
      jobId: job._id,
      root: { kind: job.rootKind, id: job.rootId, name: job.rootName, orgHandle: job.orgHandle },
      counts,
      fingerprint: job.fingerprint,
      scope,
      phase: (job.phase ?? "completed") as HierarchyDeleteWorkerPhase,
      cursor: job.cursor ?? 0,
      status: job.status,
      isRetryable: false,
    })
  }

  if (args.expectedPhase !== undefined && job.phase !== undefined && job.phase !== args.expectedPhase) {
    return createResult({
      jobId: job._id,
      root: { kind: job.rootKind, id: job.rootId, name: job.rootName, orgHandle: job.orgHandle },
      counts,
      fingerprint: job.fingerprint,
      scope,
      phase: job.phase as HierarchyDeleteWorkerPhase,
      cursor: job.cursor ?? 0,
      status: job.status,
      isRetryable: false,
    })
  }
  if (args.expectedCursor !== undefined && job.cursor !== undefined && job.cursor !== args.expectedCursor) {
    return createResult({
      jobId: job._id,
      root: { kind: job.rootKind, id: job.rootId, name: job.rootName, orgHandle: job.orgHandle },
      counts,
      fingerprint: job.fingerprint,
      scope,
      phase: (job.phase ?? "delete_r2_objects") as HierarchyDeleteWorkerPhase,
      cursor: job.cursor ?? 0,
      status: job.status,
      isRetryable: false,
    })
  }

  const currentPhase = (job.phase ?? "delete_r2_objects") as HierarchyDeleteWorkerPhase
  const currentCursor = job.cursor ?? 0

  const isLocked = await hierarchyDeleteRootLockCheckFn(ctx.db, job.rootKind, job.rootId, job._id, currentPhase)
  if (!isLocked) {
    const now = nowIso()
    await ctx.db.patch(job._id, {
      status: "failed",
      isRetryable: false,
      error: "Root lock lost: root entity is no longer locked by this deletion job",
      updatedAt: now,
    })
    return createResultError(op, "Root lock lost")
  }

  const currentState: HierarchyDeleteJobState = {
    jobId: job._id,
    root: { kind: job.rootKind, id: job.rootId, name: job.rootName, orgHandle: job.orgHandle },
    counts,
    fingerprint: job.fingerprint,
    scope,
    phase: currentPhase,
    cursor: currentCursor,
    status: "in_progress",
    isRetryable: false,
  }

  const stepResult = await hierarchyDeleteWorkerDbStepFn(ctx, currentState)
  if (!stepResult.success) {
    const now = nowIso()
    await ctx.db.patch(job._id, {
      status: "failed",
      isRetryable: false,
      error: stepResult.errorMessage,
      updatedAt: now,
    })
    return stepResult
  }

  const nextState = stepResult.data
  const nextStatus =
    nextState.status === "completed" || nextState.phase === "completed"
      ? "completed"
      : nextState.status === "error" || nextState.status === "failed"
        ? "failed"
        : "in_progress"
  const isRetryable = nextState.isRetryable ?? false
  const now = nowIso()

  await ctx.db.patch(job._id, {
    phase: nextState.phase,
    cursor: nextState.cursor,
    status: nextStatus,
    isRetryable,
    error: nextState.errorMessage,
    updatedAt: now,
  })

  if (nextStatus === "in_progress") {
    if (ctx.scheduler && typeof ctx.scheduler.runAfter === "function") {
      await ctx.scheduler.runAfter(0, internal.hierarchyDeleteActions.hierarchyDeleteWorkerStepInternalAction, {
        jobId: job._id,
        expectedPhase: nextState.phase,
        expectedCursor: nextState.cursor,
      })
    }
  }

  return createResult(nextState)
}
