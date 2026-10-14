import type { Id } from "#convex/_generated/dataModel.js"
import type { MutationCtx, QueryCtx } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import type { DocOrg } from "#src/org/org_convex/IdOrg.ts"
import { orgGetByHandleFn } from "#src/org/org_convex/orgGetByHandleFn.ts"

export async function teamOrgResolveFn(
  ctx: QueryCtx | MutationCtx,
  context: { orgId?: Id<"orgs">; orgHandle?: string },
): PromiseResult<DocOrg> {
  const op = "teamOrgResolveFn"
  if (!context.orgId && context.orgHandle === undefined) {
    return createResultError(op, "Organization ID or handle is required")
  }
  let org: DocOrg | null = null
  if (context.orgId) {
    const normalizedOrgId = ctx.db.normalizeId("orgs", context.orgId)
    if (!normalizedOrgId) {
      return createResultError(op, "Organization not found")
    }
    org = await ctx.db.get("orgs", normalizedOrgId)
  } else {
    org = await orgGetByHandleFn(ctx, context.orgHandle!)
  }
  if (!org) return createResultError(op, "Organization not found")
  if (context.orgHandle !== undefined && context.orgHandle !== org.orgHandle) {
    return createResultError(op, "Organization context does not match")
  }
  if (org.deleting) {
    return createResultError(op, "Organization is currently being deleted")
  }
  return createResult(org)
}
