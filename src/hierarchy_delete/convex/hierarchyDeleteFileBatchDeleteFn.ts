import type { MutationCtx } from "#convex/_generated/server.js"
import type { HierarchyBatchDeleteResult } from "#src/hierarchy_delete/convex/HierarchyBatchDeleteResult.ts"

const MAX_PER_ITEM = 50
const MAX_STEP_OPS = 100

export async function hierarchyDeleteFileBatchDeleteFn(
  ctx: MutationCtx,
  fileIds: readonly string[],
  _scopeResourceIds?: readonly string[],
): Promise<HierarchyBatchDeleteResult> {
  let deletedCount = 0
  let processedCount = 0
  let pendingSameItem = false

  for (let i = 0; i < fileIds.length; i++) {
    const fileId = fileIds[i]
    if (!fileId) {
      processedCount++
      continue
    }

    // 1. Delete link rows from resourceFiles via fileId index
    const rfDocs = await ctx.db
      .query("resourceFiles")
      .withIndex("fileId", (q) => q.eq("fileId", fileId))
      .take(MAX_PER_ITEM)

    for (const rf of rfDocs) {
      await ctx.db.delete("resourceFiles", rf._id)
      deletedCount++
    }

    if (rfDocs.length === MAX_PER_ITEM) {
      pendingSameItem = true
      break
    }

    // 2. All resourceFiles links gone; now delete doc(s) from files table
    const fileDocs = await ctx.db
      .query("files")
      .withIndex("fileId", (q) => q.eq("fileId", fileId))
      .take(MAX_PER_ITEM)

    for (const doc of fileDocs) {
      await ctx.db.delete("files", doc._id)
      deletedCount++
    }

    if (fileDocs.length === MAX_PER_ITEM) {
      pendingSameItem = true
      break
    }

    // All relationships and docs for this file are completely cleaned
    processedCount++

    if (deletedCount >= MAX_STEP_OPS) {
      break
    }
  }

  const hasMore = pendingSameItem || processedCount < fileIds.length

  return {
    deletedCount,
    pendingSameItem,
    hasMore,
    processedCount,
  }
}
