import type {
  HierarchyDeleteScope,
  HierarchyDeleteScopeInput,
} from "#src/hierarchy_delete/model/hierarchyDeleteScopeSchema.ts"

export async function hierarchyDeleteFingerprintCreate(
  scope: HierarchyDeleteScope | HierarchyDeleteScopeInput,
): Promise<string> {
  const canonical = JSON.stringify({
    fileIds: Array.from(new Set(scope.fileIds)).sort(),
    noteIds: Array.from(new Set(scope.noteIds)).sort(),
    orgIds: Array.from(new Set(scope.orgIds)).sort(),
    orgInvitationIds: Array.from(new Set(scope.orgInvitationIds ?? [])).sort(),
    orgMemberIds: Array.from(new Set(scope.orgMemberIds ?? [])).sort(),
    projectIds: Array.from(new Set(scope.projectIds)).sort(),
    resourceIds: Array.from(new Set(scope.resourceIds)).sort(),
    teamIds: Array.from(new Set(scope.teamIds)).sort(),
  })
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")
}
