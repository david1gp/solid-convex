import type { MutationCtx } from "#convex/_generated/server.js"
import type { HierarchyBatchDeleteResult } from "#src/hierarchy_delete/convex/HierarchyBatchDeleteResult.ts"

const MAX_PER_ITEM = 50
const MAX_STEP_OPS = 100

export async function hierarchyDeleteResourceBatchDeleteFn(
  ctx: MutationCtx,
  resourceIds: readonly string[],
): Promise<HierarchyBatchDeleteResult> {
  let deletedCount = 0
  let processedCount = 0
  let pendingSameItem = false

  for (let i = 0; i < resourceIds.length; i++) {
    const resourceId = resourceIds[i]
    if (!resourceId) {
      processedCount++
      continue
    }

    // 1. Delete link rows from resourceFiles via resourceId index
    const rfDocs = await ctx.db
      .query("resourceFiles")
      .withIndex("resourceId", (q) => q.eq("resourceId", resourceId))
      .take(MAX_PER_ITEM)

    for (const rf of rfDocs) {
      await ctx.db.delete("resourceFiles", rf._id)
      deletedCount++
    }

    if (rfDocs.length === MAX_PER_ITEM) {
      pendingSameItem = true
      break
    }

    // 2. Delete link rows from orgResources via resourceId index
    const orgResDocs = await ctx.db
      .query("orgResources")
      .withIndex("resourceId", (q) => q.eq("resourceId", resourceId))
      .take(MAX_PER_ITEM)

    for (const orgRes of orgResDocs) {
      await ctx.db.delete("orgResources", orgRes._id)
      deletedCount++
    }

    if (orgResDocs.length === MAX_PER_ITEM) {
      pendingSameItem = true
      break
    }

    // 3. Relationships are gone; delete doc(s) from resources table
    const resDocs = await ctx.db
      .query("resources")
      .withIndex("resourceId", (q) => q.eq("resourceId", resourceId))
      .take(MAX_PER_ITEM)

    for (const doc of resDocs) {
      await ctx.db.delete("resources", doc._id)
      deletedCount++
    }

    if (resDocs.length === MAX_PER_ITEM) {
      pendingSameItem = true
      break
    }

    // Resource and relationships completely cleaned
    processedCount++

    if (deletedCount >= MAX_STEP_OPS) {
      break
    }
  }

  const hasMore = pendingSameItem || processedCount < resourceIds.length

  return {
    deletedCount,
    pendingSameItem,
    hasMore,
    processedCount,
  }
}
