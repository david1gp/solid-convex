import * as a from "valibot"

export const hierarchyDeleteScopeSchema = a.object({
  orgIds: a.array(a.string()),
  teamIds: a.array(a.string()),
  projectIds: a.array(a.string()),
  noteIds: a.array(a.string()),
  resourceIds: a.array(a.string()),
  fileIds: a.array(a.string()),
  orgMemberIds: a.optional(a.array(a.string()), () => []),
  orgInvitationIds: a.optional(a.array(a.string()), () => []),
})

export type HierarchyDeleteScope = a.InferOutput<typeof hierarchyDeleteScopeSchema>
export type HierarchyDeleteScopeInput = a.InferInput<typeof hierarchyDeleteScopeSchema>
