import type { Id } from "#convex/_generated/dataModel.js"
import type { MutationCtx, QueryCtx } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import { assignmentResolveFn } from "#src/assignment/convex/assignmentResolveFn.ts"
import type { AssignmentTarget } from "#src/assignment/model/assignmentTargetSchema.ts"
import { hierarchyDeleteAncestryGuardFn } from "#src/hierarchy_delete/convex/hierarchyDeleteAncestryGuardFn.ts"

export type AssignmentCurrentGuardTarget =
  | {
      kind: "resource"
      doc: {
        resourceId?: string | undefined
        assignment?: AssignmentTarget | undefined
        orgId?: string | undefined
        teamId?: string | undefined
        projectId?: string | undefined
        noteId?: string | undefined
        deletedAt?: string | undefined
        deleting?: boolean | undefined
      }
    }
  | {
      kind: "file"
      doc: {
        fileId?: string | undefined
        resourceId?: string | undefined
        assignment?: AssignmentTarget | undefined
        orgId?: string | undefined
        teamId?: string | undefined
        projectId?: string | undefined
        noteId?: string | undefined
        deletedAt?: string | undefined
        deleting?: boolean | undefined
      }
    }

export async function assignmentCurrentGuardFn(
  ctx: QueryCtx | MutationCtx,
  target: AssignmentCurrentGuardTarget,
): PromiseResult<null> {
  const op = "assignmentCurrentGuardFn"

  if (target.kind === "resource") {
    if (target.doc.deletedAt || target.doc.deleting) {
      return createResultError(op, "Resource is currently being deleted")
    }

    const hasAssignment =
      target.doc.assignment !== undefined ||
      target.doc.orgId !== undefined ||
      target.doc.teamId !== undefined ||
      target.doc.projectId !== undefined ||
      target.doc.noteId !== undefined

    if (hasAssignment) {
      const res = await assignmentResolveFn(
        ctx,
        target.doc.assignment !== undefined
          ? { assignment: target.doc.assignment }
          : {
              orgId: (target.doc.orgId ?? undefined) as Id<"orgs"> | undefined,
              teamId: (target.doc.teamId ?? undefined) as Id<"teams"> | undefined,
              projectId: (target.doc.projectId ?? undefined) as Id<"projects"> | undefined,
              noteId: (target.doc.noteId ?? undefined) as Id<"notes"> | undefined,
            },
      )
      if (!res.success) return res
    }

    if (target.doc.resourceId) {
      const legacyOrgResources = await ctx.db
        .query("orgResources")
        .withIndex("resourceId", (q) => q.eq("resourceId", target.doc.resourceId!))
        .collect()

      for (const orgRes of legacyOrgResources) {
        if (orgRes.orgId) {
          const guard = await hierarchyDeleteAncestryGuardFn(ctx, { kind: "org", id: orgRes.orgId })
          if (!guard.success) return guard
        }
      }
    }

    return createResult(null)
  }

  if (target.kind === "file") {
    if (target.doc.deletedAt || target.doc.deleting) {
      return createResultError(op, "File is currently being deleted")
    }

    const hasAssignment =
      target.doc.assignment !== undefined ||
      target.doc.orgId !== undefined ||
      target.doc.teamId !== undefined ||
      target.doc.projectId !== undefined ||
      target.doc.noteId !== undefined

    if (hasAssignment) {
      const res = await assignmentResolveFn(
        ctx,
        target.doc.assignment !== undefined
          ? { assignment: target.doc.assignment }
          : {
              orgId: (target.doc.orgId ?? undefined) as Id<"orgs"> | undefined,
              teamId: (target.doc.teamId ?? undefined) as Id<"teams"> | undefined,
              projectId: (target.doc.projectId ?? undefined) as Id<"projects"> | undefined,
              noteId: (target.doc.noteId ?? undefined) as Id<"notes"> | undefined,
            },
      )
      if (!res.success) return res
    }

    if (target.doc.resourceId) {
      const resource = await ctx.db
        .query("resources")
        .withIndex("resourceId", (q) => q.eq("resourceId", target.doc.resourceId!))
        .first()

      if (resource) {
        const resGuard = await assignmentCurrentGuardFn(ctx, { kind: "resource", doc: resource })
        if (!resGuard.success) return resGuard
      }
    }

    return createResult(null)
  }

  return createResult(null)
}
