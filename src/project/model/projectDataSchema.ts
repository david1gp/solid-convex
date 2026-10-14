import * as a from "valibot"
import { stringSchemaDescription, stringSchemaName } from "#src/utils/valibot/stringSchema.ts"

export const projectDataSchema = a.object({
  name: stringSchemaName,
  description: a.optional(stringSchemaDescription),
})

export type ProjectData = a.InferOutput<typeof projectDataSchema>
