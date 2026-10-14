import { v } from "convex/values"
import * as a from "valibot"
import { internal } from "#convex/_generated/api.js"
import { internalMutation, type MutationCtx, mutation } from "#convex/_generated/server.js"
import { createResultError } from "#result"
import { orgGetByHandleFn } from "#src/org/org_convex/orgGetByHandleFn.ts"
import { vIdOrg } from "#src/org/org_convex/vIdOrg.ts"
import { authMutationResult } from "#src/utils/convex_backend/authMutationResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { paginationDefaultOptions } from "#src/utils/convex_backend/paginationDefaultOptions.ts"
import { paginationOptsValidator } from "#src/utils/convex_backend/paginationOptsValidator.ts"

export type OrgDeleteValidatorType = typeof orgDeleteValidator.type

export const orgDeleteFields = valibotToConvex({ orgHandle: a.string() })

export const orgDeleteValidator = v.object(orgDeleteFields)

export const orgDeleteMutation = mutation({
  args: createTokenValidator(orgDeleteFields),
  handler: async (ctx, args) =>
    authMutationResult(ctx, args, async () => {
      const op = "orgDeleteMutation"
      return createResultError(
        op,
        "Direct organization deletion is disabled; confirmation via hierarchyDeleteConfirmMutation is required",
      )
    }),
})

const orgResourceProjectionsDeleteFields = {
  orgId: v.optional(vIdOrg),
  ...valibotToConvex({ orgHandle: a.string() }),
  paginationOpts: paginationOptsValidator,
} as const

const orgResourceProjectionsDeleteValidator = v.object(orgResourceProjectionsDeleteFields)

export const orgResourceProjectionsDeleteInternalMutation = internalMutation({
  args: orgResourceProjectionsDeleteValidator,
  handler: orgResourceProjectionsDeleteFn,
})

export async function orgDeleteMutationFn(ctx: MutationCtx, args: OrgDeleteValidatorType): Promise<null> {
  const org = await orgGetByHandleFn(ctx, args.orgHandle)
  if (!org) {
    await orgResourceProjectionsDeleteFn(ctx, {
      orgHandle: args.orgHandle,
      paginationOpts: paginationDefaultOptions,
    })
    return null // idempotent
  }
  const orgId = org._id

  // Delete all members of the org
  const members = await ctx.db
    .query("orgMembers")
    .withIndex("orgId", (q) => q.eq("orgId", orgId))
    .collect()
  await Promise.all(members.map((member) => ctx.db.delete("orgMembers", member._id)))
  await orgResourceProjectionsDeleteFn(ctx, {
    orgId,
    orgHandle: args.orgHandle,
    paginationOpts: paginationDefaultOptions,
  })
  // Delete org
  await ctx.db.delete("orgs", orgId)
  return null
}

async function orgResourceProjectionsDeleteFn(
  ctx: MutationCtx,
  args: typeof orgResourceProjectionsDeleteValidator.type,
): Promise<null> {
  const paginationOpts = args.paginationOpts ?? paginationDefaultOptions
  const result = await ctx.db
    .query("orgResources")
    .withIndex("orgHandle", (q) => q.eq("orgHandle", args.orgHandle))
    .paginate(paginationOpts)

  await Promise.all(
    result.page.map(async (orgResource) => {
      const sourceOrg = await ctx.db.get("orgs", orgResource.orgId)
      if (sourceOrg && sourceOrg._id !== args.orgId) return
      await ctx.db.delete("orgResources", orgResource._id)
    }),
  )

  if (!result.isDone) {
    await ctx.scheduler.runAfter(0, internal.org.orgResourceProjectionsDeleteInternalMutation, {
      orgId: args.orgId,
      orgHandle: args.orgHandle,
      paginationOpts: { ...paginationOpts, cursor: result.continueCursor },
    })
  }

  return null
}
