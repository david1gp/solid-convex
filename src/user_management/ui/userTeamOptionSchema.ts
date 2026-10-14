import * as v from "valibot"

export const userTeamOptionSchema = v.object({
  id: v.string(),
  name: v.string(),
  subtitle: v.optional(v.string()),
})

export type UserTeamOption = v.InferOutput<typeof userTeamOptionSchema>
