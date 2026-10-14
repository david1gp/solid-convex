import type { MutationCtx } from "#convex/_generated/server.js"
import type { HierarchyBatchDeleteResult } from "#src/hierarchy_delete/convex/HierarchyBatchDeleteResult.ts"

type HierarchyBatchDeleteKind = "notes" | "projects" | "teams" | "org_members" | "orgs"

const MAX_PER_ITEM = 50
const MAX_STEP_OPS = 100

export async function hierarchyDeleteHierarchyBatchDeleteFn(
  ctx: MutationCtx,
  kind: HierarchyBatchDeleteKind,
  ids: readonly string[],
): Promise<HierarchyBatchDeleteResult> {
  let deletedCount = 0
  let processedCount = 0
  let pendingSameItem = false

  if (kind === "org_members") {
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i]
      if (!id) {
        processedCount++
        continue
      }
      try {
        const normalizedOrgId = ctx.db.normalizeId("orgs", id)
        let orgDoc = normalizedOrgId ? await ctx.db.get("orgs", normalizedOrgId) : null
        if (!orgDoc) {
          orgDoc = await ctx.db
            .query("orgs")
            .withIndex("orgHandle", (q) => q.eq("orgHandle", id))
            .first()
        }

        const targetOrgId = orgDoc ? orgDoc._id : normalizedOrgId
        const targetOrgHandle = orgDoc?.orgHandle ?? id

        // 1. Delete orgMembers bounded
        if (targetOrgId) {
          const members = await ctx.db
            .query("orgMembers")
            .withIndex("orgId", (q) => q.eq("orgId", targetOrgId))
            .take(MAX_PER_ITEM)

          for (const m of members) {
            await ctx.db.delete("orgMembers", m._id)
            deletedCount++
          }

          if (members.length === MAX_PER_ITEM) {
            pendingSameItem = true
            break
          }
        }

        // 2. Delete orgInvitations bounded
        if (targetOrgHandle) {
          const invs = await ctx.db
            .query("orgInvitations")
            .withIndex("orgHandle", (q) => q.eq("orgHandle", targetOrgHandle))
            .take(MAX_PER_ITEM)

          for (const inv of invs) {
            await ctx.db.delete("orgInvitations", inv._id)
            deletedCount++
          }

          if (invs.length === MAX_PER_ITEM) {
            pendingSameItem = true
            break
          }
        }

        // 3. Delete orgResources bounded
        if (targetOrgHandle) {
          const orgRes = await ctx.db
            .query("orgResources")
            .withIndex("orgHandle", (q) => q.eq("orgHandle", targetOrgHandle))
            .take(MAX_PER_ITEM)

          for (const r of orgRes) {
            await ctx.db.delete("orgResources", r._id)
            deletedCount++
          }

          if (orgRes.length === MAX_PER_ITEM) {
            pendingSameItem = true
            break
          }
        }

        // Org relationships are completely cleaned
        processedCount++

        if (deletedCount >= MAX_STEP_OPS) {
          break
        }
      } catch {
        // ID might be non-Convex format; advance if error
        processedCount++
      }
    }

    const hasMore = pendingSameItem || processedCount < ids.length
    return {
      deletedCount,
      pendingSameItem,
      hasMore,
      processedCount,
    }
  }

  if (kind === "orgs") {
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i]
      if (!id) {
        processedCount++
        continue
      }
      try {
        const normalizedOrgId = ctx.db.normalizeId("orgs", id)
        let orgDoc = normalizedOrgId ? await ctx.db.get("orgs", normalizedOrgId) : null
        if (!orgDoc) {
          orgDoc = await ctx.db
            .query("orgs")
            .withIndex("orgHandle", (q) => q.eq("orgHandle", id))
            .first()
        }
        if (orgDoc) {
          await ctx.db.delete("orgs", orgDoc._id)
          deletedCount++
        }
      } catch {
        // ID might be non-Convex format
      }
      processedCount++
      if (deletedCount >= MAX_STEP_OPS) {
        break
      }
    }

    const hasMore = processedCount < ids.length
    return {
      deletedCount,
      pendingSameItem: false,
      hasMore,
      processedCount,
    }
  }

  // notes, projects, teams
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i]
    if (!id) {
      processedCount++
      continue
    }
    try {
      const normalizedId = (ctx.db.normalizeId(kind, id) ?? id) as any
      const doc = await ctx.db.get(normalizedId)
      if (doc) {
        await ctx.db.delete(kind, doc._id as any)
        deletedCount++
      }
    } catch {
      // ID might be non-Convex format
    }
    processedCount++
    if (deletedCount >= MAX_STEP_OPS) {
      break
    }
  }

  const hasMore = processedCount < ids.length
  return {
    deletedCount,
    pendingSameItem: false,
    hasMore,
    processedCount,
  }
}
