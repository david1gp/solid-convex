import { v } from "convex/values"
import * as a from "valibot"
import type { Id } from "#convex/_generated/dataModel.js"
import { type MutationCtx, mutation } from "#convex/_generated/server.js"
import { createResult, createResultError } from "#result"
import { internal } from "#convex/_generated/api.js"
import { hierarchyDeleteJobStateCreate } from "#src/hierarchy_delete/model/hierarchyDeleteJobStateCreate.ts"
import { hierarchyDeleteRootResolveFn } from "#src/hierarchy_delete/convex/hierarchyDeleteRootResolveFn.ts"
import { hierarchyDeleteScopeDiscoverFn } from "#src/hierarchy_delete/convex/hierarchyDeleteScopeDiscoverFn.ts"
import { hierarchyDeleteTargetConvexFields } from "#src/hierarchy_delete/convex/hierarchyDeleteTargetConvexFields.ts"
import type { HierarchyDeleteConfirmResult } from "#src/hierarchy_delete/model/hierarchyDeleteConfirmResultSchema.ts"
import { hierarchyDeleteTargetSchema } from "#src/hierarchy_delete/model/hierarchyDeleteTargetSchema.ts"
import { authCredentialResolve } from "#src/utils/convex_backend/authCredentialResolve.ts"
import { authMutationResult } from "#src/utils/convex_backend/authMutationResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"
import { nowIso } from "#utils/date/nowIso.js"

export const hierarchyDeleteConfirmMutation = mutation({
  args: createTokenValidator({
    ...hierarchyDeleteTargetConvexFields,
    fingerprint: v.string(),
  }),
  handler: (ctx, args) =>
    authMutationResult(ctx, args, async (ctx, data) => {
      const op = "hierarchyDeleteConfirmMutation"
      const parsed = a.safeParse(hierarchyDeleteTargetSchema, {
        kind: data.kind,
        orgId: data.orgId,
        orgHandle: data.orgHandle,
        teamId: data.teamId,
        projectId: data.projectId,
        noteId: data.noteId,
      })
      if (!parsed.success) {
        return createResultError(op, "Invalid hierarchy delete target: " + JSON.stringify(parsed.issues))
      }

      // 1. Resolve root entity
      const rootResult = await hierarchyDeleteRootResolveFn(ctx, parsed.output)
      if (!rootResult.success) {
        return rootResult
      }
      const root = rootResult.data

      // Check if root entity is already locked for deletion
      const isAlreadyDeleting = await checkRootIsDeleting(ctx, root.kind, root.id)
      if (isAlreadyDeleting) {
        return createResultError(op, "Root entity is already locked for deletion")
      }

      // Check if there is already an active deletion job for this root
      const existingJob = await ctx.db
        .query("hierarchyDeleteJobs")
        .withIndex("rootId", (q) => q.eq("rootId", root.id))
        .filter((q) => q.or(q.eq(q.field("status"), "pending"), q.eq(q.field("status"), "in_progress")))
        .first()
      if (existingJob) {
        return createResultError(op, "A deletion job is already pending or in progress for this entity")
      }

      // 2. Recompute exact scope
      const previewResult = await hierarchyDeleteScopeDiscoverFn(ctx, parsed.output, { limit: data.limit })
      if (!previewResult.success) {
        return previewResult
      }
      const preview = previewResult.data

      // 3. Reject if truncated
      if (preview.isTruncated) {
        return createResultError(op, "Deletion scope is truncated; cannot confirm deletion")
      }

      // 4. Reject if changed (stale fingerprint)
      if (preview.fingerprint !== data.fingerprint) {
        return createResultError(op, "Hierarchy scope has changed since preview (stale fingerprint)")
      }

      // 5. Authenticate user
      const credential = await authCredentialResolve(ctx, args.token)
      if (!credential.success) {
        return credential
      }
      const requestedByUserId = credential.data.userId

      // 6. Atomically: lock root and persist deletion job with frozen scope
      const now = nowIso()
      const jobId = await ctx.db.insert("hierarchyDeleteJobs", {
        rootKind: root.kind,
        rootId: root.id,
        rootName: root.name,
        orgHandle: root.orgHandle,
        fingerprint: preview.fingerprint,
        status: "pending",
        phase: "delete_r2_objects",
        cursor: 0,
        isRetryable: false,
        counts: preview.counts,
        scope: preview.scope,
        requestedByUserId,
        createdAt: now,
        updatedAt: now,
      })

      // Lock root entity
      await lockRootEntity(ctx, root.kind, root.id, jobId)

      // Also persist snapshot record for audit
      await ctx.db.insert("hierarchyDeleteSnapshots", {
        rootKind: root.kind,
        rootId: root.id,
        fingerprint: preview.fingerprint,
        counts: preview.counts,
        scope: preview.scope,
        isTruncated: false,
        createdAt: now,
        updatedAt: now,
      })

      // Wire worker scheduling on creation with authoritative jobId
      await ctx.scheduler.runAfter(0, internal.hierarchyDeleteActions.hierarchyDeleteWorkerStepInternalAction, {
        jobId,
        expectedPhase: "delete_r2_objects",
        expectedCursor: 0,
      })

      console.info(op, { jobId, rootKind: root.kind, rootId: root.id, fingerprint: preview.fingerprint })

      const result: HierarchyDeleteConfirmResult = {
        jobId,
        status: "pending",
        root,
        counts: preview.counts,
        fingerprint: preview.fingerprint,
      }

      return createResult(result)
    }),
})

async function checkRootIsDeleting(
  ctx: MutationCtx,
  kind: "org" | "team" | "project" | "note",
  id: string,
): Promise<boolean> {
  if (kind === "org") {
    const doc = await ctx.db.get("orgs", id as Id<"orgs">)
    return Boolean(doc?.deleting)
  }
  if (kind === "team") {
    const doc = await ctx.db.get("teams", id as Id<"teams">)
    return Boolean(doc?.deleting)
  }
  if (kind === "project") {
    const doc = await ctx.db.get("projects", id as Id<"projects">)
    return Boolean(doc?.deleting)
  }
  if (kind === "note") {
    const doc = await ctx.db.get("notes", id as Id<"notes">)
    return Boolean(doc?.deleting)
  }
  return false
}

async function lockRootEntity(
  ctx: MutationCtx,
  kind: "org" | "team" | "project" | "note",
  id: string,
  jobId: string,
): Promise<void> {
  if (kind === "org") {
    await ctx.db.patch("orgs", id as Id<"orgs">, { deleting: true, deletionJobId: jobId })
  } else if (kind === "team") {
    await ctx.db.patch("teams", id as Id<"teams">, { deleting: true, deletionJobId: jobId })
  } else if (kind === "project") {
    await ctx.db.patch("projects", id as Id<"projects">, { deleting: true, deletionJobId: jobId })
  } else if (kind === "note") {
    await ctx.db.patch("notes", id as Id<"notes">, { deleting: true, deletionJobId: jobId })
  }
}
