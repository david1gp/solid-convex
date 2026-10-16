import { v } from "convex/values"
import * as a from "valibot"
import { internalMutation, type MutationCtx, mutation } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import { orgGetByHandleFn } from "#src/org/org_convex/orgGetByHandleFn.ts"
import { vIdOrg } from "#src/org/org_convex/vIdOrg.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authMutationResult } from "#src/utils/convex_backend/authMutationResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"

export type OrgResourceRemoveMutationValidatorType = typeof orgResourceRemoveValidator.type

export const orgResourceRemoveFields = {
  orgId: v.optional(vIdOrg),
  ...valibotToConvex({ orgHandle: a.string(), resourceId: a.string() }),
} as const

export const orgResourceRemoveValidator = v.object(orgResourceRemoveFields)

export const orgResourceRemoveMutation = mutation({
  args: createTokenValidator(orgResourceRemoveFields),
  handler: async (ctx, args) => authMutationResult(ctx, args, orgResourceRemoveMutationFn),
})

export const orgResourceRemoveInternalMutation = internalMutation({
  args: orgResourceRemoveValidator,
  handler: orgResourceRemoveMutationFn,
})

export async function orgResourceRemoveMutationFn(
  ctx: MutationCtx,
  args: OrgResourceRemoveMutationValidatorType,
): PromiseResult<null> {
  const op = "orgResourceRemoveMutationFn"
  const org = args.orgId ? await ctx.db.get("orgs", args.orgId) : await orgGetByHandleFn(ctx, args.orgHandle)
  if (!org) {
    return createResultError(op, "Organization not found", args.orgHandle)
  }
  const list = await ctx.db
    .query("orgResources")
    .withIndex("orgHandleResourceId", (q) => q.eq("orgHandle", args.orgHandle).eq("resourceId", args.resourceId))
    .collect()
  await Promise.all(list.map((e) => ctx.db.delete("orgResources", e._id)))
  return createResult(null)
}
