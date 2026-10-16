import { v } from "convex/values"
import * as a from "valibot"
import { internalMutation, type MutationCtx } from "#convex/_generated/server.js"
import { createResult, type PromiseResult } from "#result"
import { resourceGetDocFn } from "#src/resource/convex/resourceGetQuery.ts"
import { resourceSearchProjection } from "#src/resource/convex/resourceSearchProjection.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { paginationDefaultOptions } from "#src/utils/convex_backend/paginationDefaultOptions.ts"
import { paginationOptsValidator } from "#src/utils/convex_backend/paginationOptsValidator.ts"

const resourceSearchProjectionBackfillFields = {
  ...valibotToConvex({ target: a.union([a.literal("resources"), a.literal("orgResources")]) }),
  paginationOpts: paginationOptsValidator,
} as const

const resourceSearchProjectionBackfillValidator = v.object(resourceSearchProjectionBackfillFields)

export const resourceSearchProjectionBackfillInternalMutation = internalMutation({
  args: resourceSearchProjectionBackfillValidator,
  handler: resourceSearchProjectionBackfillFn,
})

async function resourceSearchProjectionBackfillFn(
  ctx: MutationCtx,
  args: typeof resourceSearchProjectionBackfillValidator.type,
): PromiseResult<{
  target: "resources" | "orgResources"
  processed: number
  isDone: boolean
  continueCursor: string
}> {
  const paginationOpts = args.paginationOpts ?? paginationDefaultOptions
  const numItems = Number.isFinite(paginationOpts.numItems)
    ? Math.max(1, Math.min(Math.floor(paginationOpts.numItems), 100))
    : paginationDefaultOptions.numItems
  if (args.target === "resources") {
    const result = await ctx.db.query("resources").paginate({
      cursor: paginationOpts.cursor,
      numItems,
    })
    await Promise.all(
      result.page.map((resource) => ctx.db.patch("resources", resource._id, resourceSearchProjection(resource))),
    )

    return createResult({
      target: args.target,
      processed: result.page.length,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    })
  }

  const result = await ctx.db.query("orgResources").paginate({
    cursor: paginationOpts.cursor,
    numItems,
  })
  await Promise.all(
    result.page.map(async (orgResource) => {
      const resource = await resourceGetDocFn(ctx, orgResource.resourceId)
      if (!resource) {
        await ctx.db.delete("orgResources", orgResource._id)
        return
      }
      await ctx.db.patch("orgResources", orgResource._id, resourceSearchProjection(resource))
    }),
  )

  return createResult({
    target: args.target,
    processed: result.page.length,
    isDone: result.isDone,
    continueCursor: result.continueCursor,
  })
}
