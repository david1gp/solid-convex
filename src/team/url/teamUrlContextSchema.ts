import * as a from "valibot"
import { orgHandleSchema } from "#src/org/org_model_field/orgHandleSchema.ts"
import { stringSchemaId } from "#src/utils/valibot/stringSchema.ts"

export const teamUrlContextSchema = a.variant("view", [
  a.object({ view: a.literal("list"), orgHandle: a.optional(orgHandleSchema) }),
  a.object({ view: a.literal("create"), orgHandle: orgHandleSchema }),
  a.object({ view: a.literal("detail"), orgHandle: a.optional(orgHandleSchema), teamId: stringSchemaId }),
  a.object({ view: a.literal("edit"), orgHandle: a.optional(orgHandleSchema), teamId: stringSchemaId }),
])

export type TeamUrlContext = a.InferOutput<typeof teamUrlContextSchema>
