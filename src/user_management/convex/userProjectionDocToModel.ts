import type { Doc } from "#convex/_generated/dataModel.d.ts"
import type { UserProjection } from "#src/user_management/model/userProjectionSchema.ts"

export function userProjectionDocToModel(doc: Doc<"userProjections">): UserProjection {
  return {
    userId: doc.userId,
    organizationId: doc.organizationId,
    username: doc.username,
    preferredLoginName: doc.preferredLoginName,
    displayName: doc.displayName,
    email: doc.email,
    state: doc.state,
    isHuman: doc.isHuman,
    roles: doc.roles,
    teamIds: doc.teamIds,
    syncedAt: doc.syncedAt,
  }
}
