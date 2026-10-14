import type { MutationCtx, QueryCtx } from "#convex/_generated/server.js"
import type { HierarchyDeleteResolvedRoot } from "#src/hierarchy_delete/model/hierarchyDeleteResolvedRootSchema.ts"

export interface HierarchyDeleteFilesCollected {
  fileIds: Set<string>
  isTruncated: boolean
}

export async function hierarchyDeleteFilesCollectFn(
  ctx: QueryCtx | MutationCtx,
  root: HierarchyDeleteResolvedRoot,
  scopeOrResourceIds?: unknown,
  resourceIdsOrMaxItems?: Set<string> | number,
  maxItemsArg?: number,
): Promise<HierarchyDeleteFilesCollected> {
  let resourceIds: Set<string> = new Set()
  let rawMax = 1000

  if (scopeOrResourceIds instanceof Set) {
    resourceIds = scopeOrResourceIds
    rawMax = typeof resourceIdsOrMaxItems === "number" ? resourceIdsOrMaxItems : 1000
  } else {
    if (resourceIdsOrMaxItems instanceof Set) {
      resourceIds = resourceIdsOrMaxItems
    }
    rawMax = typeof maxItemsArg === "number" ? maxItemsArg : 1000
  }

  const maxItems = Math.max(0, rawMax)
  const fileIds = new Set<string>()
  let isTruncated = false

  // 1. Direct file assignments on highest deletion-root subtree index
  const indexField =
    root.kind === "org" ? "orgId" : root.kind === "team" ? "teamId" : root.kind === "project" ? "projectId" : "noteId"

  const directRows = await ctx.db
    .query("files")
    .withIndex(indexField, (q) => q.eq(indexField, root.id as any))
    .take(maxItems + 1)

  for (const row of directRows) {
    if (row.fileId) {
      fileIds.add(row.fileId)
      if (fileIds.size > maxItems) {
        isTruncated = true
        break
      }
    }
  }

  // 2. Files linked through discovered resources (resourceFiles + files.resourceId)
  for (const resourceId of resourceIds) {
    if (isTruncated) break

    // A. Files linked via resourceFiles table
    const rfRows = await ctx.db
      .query("resourceFiles")
      .withIndex("resourceId", (q) => q.eq("resourceId", resourceId))
      .take(maxItems + 1)

    for (const row of rfRows) {
      if (!row.fileId || fileIds.has(row.fileId)) {
        continue
      }
      // Fix potentially non-existent orphan joins: verify file has metadata in files table
      const fileDoc = await ctx.db
        .query("files")
        .withIndex("fileId", (q) => q.eq("fileId", row.fileId))
        .first()

      if (fileDoc) {
        fileIds.add(row.fileId)
        if (fileIds.size > maxItems) {
          isTruncated = true
          break
        }
      }
    }

    if (isTruncated) break

    // B. Files linked via files.resourceId field (index exists, no scan fallback)
    const fileRows = await ctx.db
      .query("files")
      .withIndex("resourceId", (q) => q.eq("resourceId", resourceId))
      .take(maxItems + 1)

    for (const file of fileRows) {
      if (file.fileId && !fileIds.has(file.fileId)) {
        fileIds.add(file.fileId)
        if (fileIds.size > maxItems) {
          isTruncated = true
          break
        }
      }
    }
  }

  const finalFileIds = isTruncated ? new Set(Array.from(fileIds).slice(0, maxItems)) : fileIds

  return {
    fileIds: finalFileIds,
    isTruncated,
  }
}
