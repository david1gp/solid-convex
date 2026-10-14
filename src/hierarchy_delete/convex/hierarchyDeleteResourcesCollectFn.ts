import type { MutationCtx, QueryCtx } from "#convex/_generated/server.js"
import type { HierarchyDeleteResolvedRoot } from "#src/hierarchy_delete/model/hierarchyDeleteResolvedRootSchema.ts"

export interface HierarchyDeleteResourcesCollected {
  resourceIds: Set<string>
  isTruncated: boolean
}

export async function hierarchyDeleteResourcesCollectFn(
  ctx: QueryCtx | MutationCtx,
  root: HierarchyDeleteResolvedRoot,
  scopeOrMaxItems?:
    | { orgIds?: Set<string>; teamIds?: Set<string>; projectIds?: Set<string>; noteIds?: Set<string> }
    | number,
  maxItemsArg?: number,
): Promise<HierarchyDeleteResourcesCollected> {
  const rawMax = typeof scopeOrMaxItems === "number" ? scopeOrMaxItems : (maxItemsArg ?? 1000)
  const maxItems = Math.max(0, rawMax)
  const resourceIds = new Set<string>()
  let isTruncated = false

  // 1. Direct subtree resource assignments: query only highest deletion-root subtree index
  const indexField =
    root.kind === "org" ? "orgId" : root.kind === "team" ? "teamId" : root.kind === "project" ? "projectId" : "noteId"

  const directRows = await ctx.db
    .query("resources")
    .withIndex(indexField, (q) => q.eq(indexField, root.id as any))
    .take(maxItems + 1)

  for (const row of directRows) {
    if (row.resourceId) {
      resourceIds.add(row.resourceId)
      if (resourceIds.size > maxItems) {
        isTruncated = true
        break
      }
    }
  }

  // 2. Legacy orgResources: attached resources for organizations
  if (!isTruncated && root.kind === "org" && root.orgHandle) {
    const legacyRows = await ctx.db
      .query("orgResources")
      .withIndex("orgHandle", (q) => q.eq("orgHandle", root.orgHandle!))
      .take(maxItems + 1)

    for (const row of legacyRows) {
      if (row.resourceId) {
        resourceIds.add(row.resourceId)
        if (resourceIds.size > maxItems) {
          isTruncated = true
          break
        }
      }
    }
  }

  const finalResourceIds = isTruncated ? new Set(Array.from(resourceIds).slice(0, maxItems)) : resourceIds

  return {
    resourceIds: finalResourceIds,
    isTruncated,
  }
}
