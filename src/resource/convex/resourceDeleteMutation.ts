import { v } from "convex/values"
import * as a from "valibot"
import { internal } from "#convex/_generated/api.js"
import { internalMutation, type MutationCtx, mutation } from "#convex/_generated/server.js"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authMutationWrapResult } from "#src/utils/convex_backend/authMutationWrapResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"
import { paginationDefaultOptions } from "#src/utils/convex_backend/paginationDefaultOptions.ts"
import { paginationOptsValidator } from "#src/utils/convex_backend/paginationOptsValidator.ts"
import { nowIso } from "#utils/date/nowIso.js"

export type ResourceDeleteValidatorType = typeof resourceDeleteValidator.type

export const resourceDeleteFields = valibotToConvex({ resourceId: a.string() })

export const resourceDeleteValidator = v.object(resourceDeleteFields)

export const resourceDeleteMutation = mutation({
  args: createTokenValidator(resourceDeleteFields),
  handler: async (ctx, args) => authMutationWrapResult(ctx, args, resourceDeleteFn),
})

export const resourceDeleteInternalMutation = internalMutation({
  args: resourceDeleteValidator,
  handler: resourceDeleteFn,
})

const resourceFileRelationshipsDeleteFields = {
  ...valibotToConvex({ resourceId: a.string() }),
  resourceDocId: v.optional(v.id("resources")),
  paginationOpts: paginationOptsValidator,
} as const

const resourceFileRelationshipsDeleteValidator = v.object(resourceFileRelationshipsDeleteFields)

export const resourceFileRelationshipsDeleteInternalMutation = internalMutation({
  args: resourceFileRelationshipsDeleteValidator,
  handler: resourceFileRelationshipsDeleteFn,
})

const resourceOrgResourcesDeleteFields = {
  ...valibotToConvex({ resourceId: a.string() }),
  resourceDocId: v.optional(v.id("resources")),
  paginationOpts: paginationOptsValidator,
} as const

const resourceOrgResourcesDeleteValidator = v.object(resourceOrgResourcesDeleteFields)

export const resourceOrgResourcesDeleteInternalMutation = internalMutation({
  args: resourceOrgResourcesDeleteValidator,
  handler: resourceOrgResourcesDeleteFn,
})

export async function resourceDeleteFn(ctx: MutationCtx, args: ResourceDeleteValidatorType): Promise<null> {
  const op = "resourceDeleteFn"
  const resourceId = args.resourceId
  const resource = await ctx.db
    .query("resources")
    .withIndex("resourceId", (q) => q.eq("resourceId", args.resourceId))
    .unique()
  if (!resource) {
    await resourceFileRelationshipsDeleteFn(ctx, { resourceId, paginationOpts: paginationDefaultOptions })
    return null // idempotent
  }

  if (!resource.deletedAt) {
    await ctx.db.patch("resources", resource._id, { deletedAt: nowIso() })
    console.info(op, { resourceId })
  }
  await resourceFileRelationshipsDeleteFn(ctx, {
    resourceId,
    resourceDocId: resource._id,
    paginationOpts: paginationDefaultOptions,
  })
  // The public mutation succeeds once cleanup has been accepted by the scheduler.
  return null
}

async function resourceFileRelationshipsDeleteFn(
  ctx: MutationCtx,
  args: typeof resourceFileRelationshipsDeleteValidator.type,
): Promise<null> {
  const paginationOpts = args.paginationOpts ?? paginationDefaultOptions
  if (args.resourceDocId) {
    const resource = await ctx.db.get("resources", args.resourceDocId)
    if (!resource || resource.resourceId !== args.resourceId || !resource.deletedAt) return null
  } else {
    const resource = await ctx.db
      .query("resources")
      .withIndex("resourceId", (q) => q.eq("resourceId", args.resourceId))
      .first()
    if (resource) return null
  }
  const result = await ctx.db
    .query("resourceFiles")
    .withIndex("resourceId", (q) => q.eq("resourceId", args.resourceId))
    .paginate(paginationOpts)

  await Promise.all(result.page.map((resourceFile) => ctx.db.delete("resourceFiles", resourceFile._id)))

  if (result.isDone) {
    await ctx.scheduler.runAfter(0, internal.resource.resourceOrgResourcesDeleteInternalMutation, {
      resourceId: args.resourceId,
      resourceDocId: args.resourceDocId,
      paginationOpts: paginationDefaultOptions,
    })
    return null
  }

  await ctx.scheduler.runAfter(0, internal.resource.resourceFileRelationshipsDeleteInternalMutation, {
    resourceId: args.resourceId,
    resourceDocId: args.resourceDocId,
    paginationOpts: { ...paginationOpts, cursor: result.continueCursor },
  })

  return null
}

async function resourceOrgResourcesDeleteFn(
  ctx: MutationCtx,
  args: typeof resourceOrgResourcesDeleteValidator.type,
): Promise<null> {
  const paginationOpts = args.paginationOpts ?? paginationDefaultOptions
  if (args.resourceDocId) {
    const resource = await ctx.db.get("resources", args.resourceDocId)
    if (!resource || resource.resourceId !== args.resourceId || !resource.deletedAt) return null
  } else {
    const resource = await ctx.db
      .query("resources")
      .withIndex("resourceId", (q) => q.eq("resourceId", args.resourceId))
      .first()
    if (resource) return null
  }
  const result = await ctx.db
    .query("orgResources")
    .withIndex("resourceId", (q) => q.eq("resourceId", args.resourceId))
    .paginate(paginationOpts)

  await Promise.all(result.page.map((orgResource) => ctx.db.delete("orgResources", orgResource._id)))

  if (!result.isDone) {
    await ctx.scheduler.runAfter(0, internal.resource.resourceOrgResourcesDeleteInternalMutation, {
      resourceId: args.resourceId,
      resourceDocId: args.resourceDocId,
      paginationOpts: { ...paginationOpts, cursor: result.continueCursor },
    })
    return null
  }

  if (args.resourceDocId) {
    const resource = await ctx.db.get("resources", args.resourceDocId)
    if (resource?.resourceId === args.resourceId && resource.deletedAt) {
      await ctx.db.delete("resources", resource._id)
    }
  }
  return null
}
