import type { MutationCtx, QueryCtx } from "#convex/_generated/server.js"
import { createResult, type PromiseResult } from "#result"
import { hierarchyDeleteFilesCollectFn } from "#src/hierarchy_delete/convex/hierarchyDeleteFilesCollectFn.ts"
import { hierarchyDeleteHierarchyCollectFn } from "#src/hierarchy_delete/convex/hierarchyDeleteHierarchyCollectFn.ts"
import { hierarchyDeleteMembersCollectFn } from "#src/hierarchy_delete/convex/hierarchyDeleteMembersCollectFn.ts"
import { hierarchyDeleteResourcesCollectFn } from "#src/hierarchy_delete/convex/hierarchyDeleteResourcesCollectFn.ts"
import { hierarchyDeleteRootResolveFn } from "#src/hierarchy_delete/convex/hierarchyDeleteRootResolveFn.ts"
import { hierarchyDeleteFingerprintCreate } from "#src/hierarchy_delete/model/hierarchyDeleteFingerprintCreate.ts"
import type { HierarchyDeletePreview } from "#src/hierarchy_delete/model/hierarchyDeletePreviewSchema.ts"
import type { HierarchyDeleteTarget } from "#src/hierarchy_delete/model/hierarchyDeleteTargetSchema.ts"

export async function hierarchyDeleteScopeDiscoverFn(
  ctx: QueryCtx | MutationCtx,
  target: HierarchyDeleteTarget,
  options?: { limit?: number },
): PromiseResult<HierarchyDeletePreview> {
  const rootResult = await hierarchyDeleteRootResolveFn(ctx, target)
  if (!rootResult.success) {
    return rootResult
  }
  const root = rootResult.data

  const maxLimit = options?.limit ?? 1000

  // 1. Discover hierarchy subtree: orgs, teams, projects, notes
  const hierarchy = await hierarchyDeleteHierarchyCollectFn(ctx, root, maxLimit)

  const hierarchyCount =
    hierarchy.orgIds.size + hierarchy.teamIds.size + hierarchy.projectIds.size + hierarchy.noteIds.size

  // 2. Discover resources: legacy orgResources + direct subtree assignments
  const remainingForResources = Math.max(0, maxLimit - hierarchyCount)
  const resources = await hierarchyDeleteResourcesCollectFn(
    ctx,
    root,
    {
      orgIds: hierarchy.orgIds,
      teamIds: hierarchy.teamIds,
      projectIds: hierarchy.projectIds,
      noteIds: hierarchy.noteIds,
    },
    remainingForResources,
  )

  const totalCountSoFar = hierarchyCount + resources.resourceIds.size

  // 3. Discover files: direct subtree assignments + resourceFiles + files.resourceId
  const remainingForFiles = Math.max(0, maxLimit - totalCountSoFar)
  const files = await hierarchyDeleteFilesCollectFn(
    ctx,
    root,
    {
      orgIds: hierarchy.orgIds,
      teamIds: hierarchy.teamIds,
      projectIds: hierarchy.projectIds,
      noteIds: hierarchy.noteIds,
    },
    resources.resourceIds,
    remainingForFiles,
  )

  const countAfterFiles = totalCountSoFar + files.fileIds.size

  // 4. Discover memberships and invitations for org roots only
  const remainingForMembers = Math.max(0, maxLimit - countAfterFiles)
  const members = await hierarchyDeleteMembersCollectFn(ctx, root, remainingForMembers)

  const isTruncated =
    hierarchy.isTruncated ||
    resources.isTruncated ||
    files.isTruncated ||
    members.isTruncated ||
    countAfterFiles + members.orgMemberIds.size + members.orgInvitationIds.size > maxLimit

  const scope = {
    orgIds: Array.from(hierarchy.orgIds).sort(),
    teamIds: Array.from(hierarchy.teamIds).sort(),
    projectIds: Array.from(hierarchy.projectIds).sort(),
    noteIds: Array.from(hierarchy.noteIds).sort(),
    resourceIds: Array.from(resources.resourceIds).sort(),
    fileIds: Array.from(files.fileIds).sort(),
    orgMemberIds: Array.from(members.orgMemberIds).sort(),
    orgInvitationIds: Array.from(members.orgInvitationIds).sort(),
  }

  const fingerprint = await hierarchyDeleteFingerprintCreate(scope)

  const orgs = hierarchy.orgIds.size
  const teams = hierarchy.teamIds.size
  const projects = hierarchy.projectIds.size
  const notes = hierarchy.noteIds.size
  const resCount = resources.resourceIds.size
  const fileCount = files.fileIds.size
  const orgMembers = members.orgMemberIds.size
  const orgInvitations = members.orgInvitationIds.size
  const total = orgs + teams + projects + notes + resCount + fileCount + orgMembers + orgInvitations

  return createResult({
    root,
    counts: {
      orgs,
      teams,
      projects,
      notes,
      resources: resCount,
      files: fileCount,
      orgMembers,
      orgInvitations,
      total,
    },
    fingerprint,
    isTruncated,
    scope,
  })
}
