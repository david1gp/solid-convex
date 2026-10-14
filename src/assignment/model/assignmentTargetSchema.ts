import * as a from "valibot"
import { stringSchemaId } from "#src/utils/valibot/stringSchema.ts"

export const assignmentTargetSchema = a.union([
  a.object({ kind: a.literal("organization"), id: stringSchemaId }),
  a.object({ kind: a.literal("team"), id: stringSchemaId }),
  a.object({ kind: a.literal("project"), id: stringSchemaId }),
  a.object({ kind: a.literal("note"), id: stringSchemaId }),
])

export type AssignmentTarget = a.InferOutput<typeof assignmentTargetSchema>
