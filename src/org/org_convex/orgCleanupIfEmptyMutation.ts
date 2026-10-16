import { v } from "convex/values"
import * as a from "valibot"
import { internal } from "#convex/_generated/api.js"
import { internalMutation, type MutationCtx } from "#convex/_generated/server.js"
import { createResult, type PromiseResult } from "#result"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { paginationDefaultOptions } from "#src/utils/convex_backend/paginationDefaultOptions.ts"

export type OrgCleanupIfEmptyValidatorType = typeof orgCleanupIfEmptyValidator.type

export const orgCleanupIfEmptyFields = valibotToConvex({ orgHandle: a.string() })

export const orgCleanupIfEmptyValidator = v.object(orgCleanupIfEmptyFields)

export const orgCleanupIfEmptyInternalMutation = internalMutation({
  args: orgCleanupIfEmptyValidator,
  handler: orgCleanupIfEmptyFn,
})

export async function orgCleanupIfEmptyFn(ctx: MutationCtx, args: OrgCleanupIfEmptyValidatorType): PromiseResult<null> {
  const org = await ctx.db
    .query("orgs")
    .withIndex("orgHandle", (q) => q.eq("orgHandle", args.orgHandle))
    .unique()
  if (!org) {
    return createResult(null)
  }

  const members = await ctx.db
    .query("orgMembers")
    .withIndex("orgId", (q) => q.eq("orgId", org._id))
    .collect()

  if (members.length > 0) {
    return createResult(null)
  }

  await ctx.scheduler.runAfter(0, internal.org.orgResourceProjectionsDeleteInternalMutation, {
    orgId: org._id,
    orgHandle: org.orgHandle,
    paginationOpts: paginationDefaultOptions,
  })
  await ctx.db.delete("orgs", org._id)
  return createResult(null)
}
