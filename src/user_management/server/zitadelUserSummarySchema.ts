import * as v from "valibot"

export const zitadelUserSummarySchema = v.object({
  id: v.string(),
  username: v.optional(v.string()),
  preferredLoginName: v.optional(v.string()),
  displayName: v.optional(v.string()),
  email: v.optional(v.string()),
  state: v.optional(v.number()),
  isHuman: v.optional(v.boolean()),
})

export type ZitadelUserSummary = v.InferOutput<typeof zitadelUserSummarySchema>
