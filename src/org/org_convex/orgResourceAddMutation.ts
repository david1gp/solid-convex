import { v } from "convex/values"
import * as a from "valibot"
import { internalMutation, type MutationCtx, mutation } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import { assignmentCurrentGuardFn } from "#src/assignment/convex/assignmentCurrentGuardFn.ts"
import { assignmentResolveFn } from "#src/assignment/convex/assignmentResolveFn.ts"
import { orgGetByHandleFn } from "#src/org/org_convex/orgGetByHandleFn.ts"
import { vIdOrg } from "#src/org/org_convex/vIdOrg.ts"
import { resourceGetDocFn } from "#src/resource/convex/resourceGetQuery.ts"
import { resourceSearchProjection } from "#src/resource/convex/resourceSearchProjection.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authMutationResult } from "#src/utils/convex_backend/authMutationResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"
import { nowIso } from "#utils/date/nowIso.js"

export type OrgResourceAddMutationValidatorType = typeof orgResourceAddValidator.type

export const orgResourceAddFields = {
  orgId: v.optional(vIdOrg),
  ...valibotToConvex({ orgHandle: a.string(), resourceId: a.string() }),
} as const

export const orgResourceAddValidator = v.object(orgResourceAddFields)

export const orgResourceAddMutation = mutation({
  args: createTokenValidator(orgResourceAddFields),
  handler: async (ctx, args) => authMutationResult(ctx, args, orgResourceAddMutationFn),
})

export const orgResourceAddInternalMutation = internalMutation({
  args: orgResourceAddValidator,
  handler: orgResourceAddMutationFn,
})

export async function orgResourceAddMutationFn(
  ctx: MutationCtx,
  args: OrgResourceAddMutationValidatorType,
): PromiseResult<null> {
  const op = "orgResourceAddMutationFn"
  const org = args.orgId ? await ctx.db.get("orgs", args.orgId) : await orgGetByHandleFn(ctx, args.orgHandle)
  if (!org) {
    return createResultError(op, "Organization not found", args.orgHandle)
  }
  if (org.deleting) {
    return createResultError(op, "Organization is currently being deleted")
  }
  const resource = await resourceGetDocFn(ctx, args.resourceId)
  if (!resource) {
    return createResultError(op, "Resource not found", args.resourceId)
  }
  const resourceGuard = await assignmentCurrentGuardFn(ctx, { kind: "resource", doc: resource })
  if (!resourceGuard.success) {
    return resourceGuard
  }

  let resourceOrgId: string | undefined = resource.orgId
  if (!resourceOrgId && resource.assignment) {
    if (resource.assignment.kind === "organization") {
      resourceOrgId = resource.assignment.id
    } else {
      const resolved = await assignmentResolveFn(ctx, { assignment: resource.assignment })
      if (resolved.success) {
        resourceOrgId = resolved.data.orgId
      }
    }
  }

  if (resourceOrgId && resourceOrgId !== org._id) {
    return createResultError(op, "Resource is assigned to a different organization")
  }

  const existingOrgResource = await ctx.db
    .query("orgResources")
    .withIndex("orgHandleResourceId", (q) => q.eq("orgHandle", org.orgHandle).eq("resourceId", args.resourceId))
    .first()
  if (!existingOrgResource) {
    await ctx.db.insert("orgResources", {
      orgId: org._id,
      orgHandle: org.orgHandle,
      resourceId: args.resourceId,
      ...resourceSearchProjection(resource),
      createdAt: nowIso(),
    })
  }

  const canSetOrgAssignment = !resource.assignment && !resource.teamId && !resource.projectId && !resource.noteId

  if (canSetOrgAssignment) {
    await ctx.db.patch("resources", resource._id, {
      assignment: { kind: "organization", id: org._id },
      orgId: org._id,
      updatedAt: nowIso(),
    })
  }
  return createResult(null)
}
