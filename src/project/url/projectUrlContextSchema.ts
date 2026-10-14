import * as a from "valibot"
import { orgHandleSchema } from "#src/org/org_model_field/orgHandleSchema.ts"
import { stringSchemaId } from "#src/utils/valibot/stringSchema.ts"

const parentContext = {
  orgHandle: a.optional(orgHandleSchema),
  teamId: a.optional(stringSchemaId),
}

export const projectUrlContextSchema = a.variant("view", [
  a.object({ view: a.literal("list"), ...parentContext }),
  a.object({ view: a.literal("create"), ...parentContext, teamId: stringSchemaId }),
  a.object({ view: a.literal("detail"), ...parentContext, projectId: stringSchemaId }),
  a.object({ view: a.literal("edit"), ...parentContext, projectId: stringSchemaId }),
])

export type ProjectUrlContext = a.InferOutput<typeof projectUrlContextSchema>
