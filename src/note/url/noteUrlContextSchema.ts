import * as a from "valibot"
import { orgHandleSchema } from "#src/org/org_model_field/orgHandleSchema.ts"
import { stringSchemaId } from "#src/utils/valibot/stringSchema.ts"

const parentContext = {
  orgHandle: a.optional(orgHandleSchema),
  teamId: a.optional(stringSchemaId),
  projectId: a.optional(stringSchemaId),
}

export const noteUrlContextSchema = a.variant("view", [
  a.object({ view: a.literal("list"), ...parentContext }),
  a.object({ view: a.literal("create"), ...parentContext, projectId: stringSchemaId }),
  a.object({ view: a.literal("detail"), ...parentContext, noteId: stringSchemaId }),
  a.object({ view: a.literal("edit"), ...parentContext, noteId: stringSchemaId }),
])

export type NoteUrlContext = a.InferOutput<typeof noteUrlContextSchema>
