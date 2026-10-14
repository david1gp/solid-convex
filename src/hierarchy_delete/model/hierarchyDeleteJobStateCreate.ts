import { createResult, createResultError, type PromiseResult } from "#result"
import { hierarchyDeleteFingerprintCreate } from "#src/hierarchy_delete/model/hierarchyDeleteFingerprintCreate.ts"
import type { HierarchyDeleteJobState } from "#src/hierarchy_delete/model/hierarchyDeleteJobStateSchema.ts"
import type { HierarchyDeletePreview } from "#src/hierarchy_delete/model/hierarchyDeletePreviewSchema.ts"

export async function hierarchyDeleteJobStateCreate(
  preview: HierarchyDeletePreview,
  jobId?: string,
): PromiseResult<HierarchyDeleteJobState> {
  const op = "hierarchyDeleteJobStateCreate"

  const computedFingerprint = await hierarchyDeleteFingerprintCreate(preview.scope)
  if (computedFingerprint !== preview.fingerprint) {
    return createResultError(
      op,
      `Fingerprint mismatch: expected ${preview.fingerprint}, got ${computedFingerprint}`,
      JSON.stringify({ previewFingerprint: preview.fingerprint, computedFingerprint }),
    )
  }

  // Deduplicate scope IDs to guarantee unique sets
  const deduplicatedScope = {
    orgIds: Array.from(new Set(preview.scope.orgIds)),
    teamIds: Array.from(new Set(preview.scope.teamIds)),
    projectIds: Array.from(new Set(preview.scope.projectIds)),
    noteIds: Array.from(new Set(preview.scope.noteIds)),
    resourceIds: Array.from(new Set(preview.scope.resourceIds)),
    fileIds: Array.from(new Set(preview.scope.fileIds)),
    orgMemberIds: Array.from(new Set(preview.scope.orgMemberIds ?? [])),
    orgInvitationIds: Array.from(new Set(preview.scope.orgInvitationIds ?? [])),
  }

  const state: HierarchyDeleteJobState = {
    jobId,
    root: preview.root,
    counts: preview.counts,
    fingerprint: preview.fingerprint,
    scope: deduplicatedScope,
    phase: "delete_r2_objects",
    cursor: 0,
    status: "pending",
    isRetryable: false,
  }

  return createResult(state)
}
