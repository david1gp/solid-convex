import { v } from "convex/values"
import type { Id } from "#convex/_generated/dataModel.js"
import { mutation } from "#convex/_generated/server.js"
import { createResult, createResultError } from "#result"
import { hierarchyDeleteRootLockCheckFn } from "#src/hierarchy_delete/convex/hierarchyDeleteRootLockCheckFn.ts"
import { hierarchyDeleteWorkerScheduleFn } from "#src/hierarchy_delete/convex/hierarchyDeleteWorkerScheduleFn.ts"
import { userAdminCheckFn } from "#src/user_management/convex/userAdminCheckFn.ts"
import { authCredentialResolve } from "#src/utils/convex_backend/authCredentialResolve.ts"
import { authMutationResult } from "#src/utils/convex_backend/authMutationResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"
import { nowIso } from "#utils/date/nowIso.js"

export const hierarchyDeleteRetryMutation = mutation({
  args: createTokenValidator({
    jobId: v.string(),
  }),
  handler: (ctx, args) =>
    authMutationResult(ctx, args, async (ctx, data) => {
      const op = "hierarchyDeleteRetryMutation"

      const job = await ctx.db.get("hierarchyDeleteJobs", data.jobId as Id<"hierarchyDeleteJobs">)
      if (!job) {
        return createResultError(op, `Deletion job not found: ${data.jobId}`)
      }

      // Check user authorization (requester or admin)
      const credential = await authCredentialResolve(ctx, args.token)
      if (!credential.success) {
        return credential
      }
      const adminCheck = await userAdminCheckFn(ctx, args.token)
      const isAdmin = adminCheck.success
      if (job.requestedByUserId && job.requestedByUserId !== String(credential.data.userId) && !isAdmin) {
        return createResultError(op, "Only the requester or an administrator can retry this deletion job")
      }

      // Validate job is in failed/error state
      if (job.status !== "failed" && (job.status as string) !== "error") {
        return createResultError(
          op,
          `Cannot retry deletion job that is not in failed state: current status is ${job.status}`,
        )
      }

      // Check root lock is maintained
      const isLocked = await hierarchyDeleteRootLockCheckFn(ctx.db, job.rootKind, job.rootId, job._id, job.phase)
      if (!isLocked) {
        return createResultError(op, "Cannot retry: root entity is not locked by this deletion job")
      }

      const now = nowIso()
      await ctx.db.patch("hierarchyDeleteJobs", job._id, {
        status: "in_progress",
        error: undefined,
        isRetryable: false,
        updatedAt: now,
      })

      // Schedule worker to resume with safe same frozen scope and persisted phase/cursor
      await hierarchyDeleteWorkerScheduleFn(ctx, job._id, job.phase ?? "delete_r2_objects", job.cursor ?? 0)

      console.info(op, { jobId: job._id, rootKind: job.rootKind, rootId: job.rootId })

      return createResult({
        jobId: job._id,
        status: "in_progress",
        fingerprint: job.fingerprint,
      })
    }),
})
