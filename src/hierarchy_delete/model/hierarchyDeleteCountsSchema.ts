import * as a from "valibot"

export const hierarchyDeleteCountsSchema = a.object({
  orgs: a.number(),
  teams: a.number(),
  projects: a.number(),
  notes: a.number(),
  resources: a.number(),
  files: a.number(),
  orgMembers: a.optional(a.number(), 0),
  orgInvitations: a.optional(a.number(), 0),
  total: a.number(),
})

export type HierarchyDeleteCounts = a.InferOutput<typeof hierarchyDeleteCountsSchema>
