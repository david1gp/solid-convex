import type { Doc } from "#convex/_generated/dataModel.js"
import type { HierarchyDeleteJob } from "#src/hierarchy_delete/model/hierarchyDeleteJobSchema.ts"

export function hierarchyDeleteJobDocToModel(doc: Doc<"hierarchyDeleteJobs">): HierarchyDeleteJob {
  return {
    jobId: doc._id,
    rootKind: doc.rootKind,
    rootId: doc.rootId,
    rootName: doc.rootName,
    orgHandle: doc.orgHandle,
    fingerprint: doc.fingerprint,
    status: doc.status === "error" ? "failed" : doc.status,
    phase: doc.phase ?? "delete_r2_objects",
    cursor: doc.cursor ?? 0,
    isRetryable: doc.isRetryable ?? false,
    counts: {
      ...doc.counts,
      orgMembers: doc.counts.orgMembers ?? 0,
      orgInvitations: doc.counts.orgInvitations ?? 0,
    },
    scope: {
      ...doc.scope,
      orgMemberIds: doc.scope.orgMemberIds ?? [],
      orgInvitationIds: doc.scope.orgInvitationIds ?? [],
    },
    requestedByUserId: doc.requestedByUserId,
    error: doc.error,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}
