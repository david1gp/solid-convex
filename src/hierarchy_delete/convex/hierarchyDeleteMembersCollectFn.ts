import type { Id } from "#convex/_generated/dataModel.js"
import type { MutationCtx, QueryCtx } from "#convex/_generated/server.js"
import type { HierarchyDeleteResolvedRoot } from "#src/hierarchy_delete/model/hierarchyDeleteResolvedRootSchema.ts"

export interface HierarchyDeleteMembersCollected {
  readonly orgMemberIds: Set<string>
  readonly orgInvitationIds: Set<string>
  readonly isTruncated: boolean
}

export async function hierarchyDeleteMembersCollectFn(
  ctx: QueryCtx | MutationCtx,
  root: HierarchyDeleteResolvedRoot,
  maxItems = 1000,
): Promise<HierarchyDeleteMembersCollected> {
  const orgMemberIds = new Set<string>()
  const orgInvitationIds = new Set<string>()
  let isTruncated = false

  if (root.kind !== "org") {
    return {
      orgMemberIds,
      orgInvitationIds,
      isTruncated: false,
    }
  }

  const normalizedOrgId = ctx.db.normalizeId("orgs", root.id)
  const targetOrgId = (normalizedOrgId ?? root.id) as Id<"orgs">

  // 1. Discover orgMembers bounded
  const remainingForMembers = Math.max(0, maxItems)
  if (remainingForMembers <= 0) {
    if (maxItems <= 0) {
      const peek = await ctx.db
        .query("orgMembers")
        .withIndex("orgId", (q) => q.eq("orgId", targetOrgId))
        .first()
      if (peek) {
        isTruncated = true
      }
    }
  } else {
    const members = await ctx.db
      .query("orgMembers")
      .withIndex("orgId", (q) => q.eq("orgId", targetOrgId))
      .take(remainingForMembers + 1)

    if (members.length > remainingForMembers) {
      isTruncated = true
    }
    for (const member of members.slice(0, remainingForMembers)) {
      orgMemberIds.add(member._id)
    }
  }

  // 2. Discover orgInvitations bounded
  if (!isTruncated && root.orgHandle) {
    const remainingForInvitations = Math.max(0, maxItems - orgMemberIds.size)
    if (remainingForInvitations <= 0) {
      const peek = await ctx.db
        .query("orgInvitations")
        .withIndex("orgHandle", (q) => q.eq("orgHandle", root.orgHandle!))
        .first()
      if (peek) {
        isTruncated = true
      }
    } else {
      const invitations = await ctx.db
        .query("orgInvitations")
        .withIndex("orgHandle", (q) => q.eq("orgHandle", root.orgHandle!))
        .take(remainingForInvitations + 1)

      if (invitations.length > remainingForInvitations) {
        isTruncated = true
      }
      for (const inv of invitations.slice(0, remainingForInvitations)) {
        orgInvitationIds.add(inv._id)
      }
    }
  }

  return {
    orgMemberIds,
    orgInvitationIds,
    isTruncated,
  }
}
