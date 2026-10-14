import * as a from "valibot"
import { stringSchemaDescription, stringSchemaName } from "#src/utils/valibot/stringSchema.ts"

export const teamDataSchema = a.object({
  name: stringSchemaName,
  description: a.optional(stringSchemaDescription),
})

export type TeamData = a.InferOutput<typeof teamDataSchema>
