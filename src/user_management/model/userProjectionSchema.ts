import * as v from "valibot"

export const userProjectionSchema = v.object({
  userId: v.string(),
  organizationId: v.string(),
  username: v.optional(v.string()),
  preferredLoginName: v.optional(v.string()),
  displayName: v.optional(v.string()),
  email: v.optional(v.string()),
  state: v.optional(v.number()),
  isHuman: v.optional(v.boolean()),
  roles: v.array(v.string()),
  teamIds: v.array(v.string()),
  syncedAt: v.string(),
})

export type UserProjection = v.InferOutput<typeof userProjectionSchema>
