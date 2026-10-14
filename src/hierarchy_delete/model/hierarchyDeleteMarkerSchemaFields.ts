import * as a from "valibot"

export const hierarchyDeleteMarkerSchemaFields = {
  deleting: a.optional(a.boolean()),
  deletionJobId: a.optional(a.string()),
} as const
