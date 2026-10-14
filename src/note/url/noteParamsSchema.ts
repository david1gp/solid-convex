import * as a from "valibot"
import { orgHandleSchema } from "#src/org/org_model_field/orgHandleSchema.ts"
import { stringSchemaId } from "#src/utils/valibot/stringSchema.ts"

export const noteParamsSchema = a.object({
  orgHandle: a.optional(orgHandleSchema),
  teamId: a.optional(stringSchemaId),
  projectId: a.optional(stringSchemaId),
  noteId: a.optional(stringSchemaId),
})

export type NoteParams = a.InferOutput<typeof noteParamsSchema>
