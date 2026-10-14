import * as a from "valibot"
import { assignmentTargetKindSchema } from "#src/assignment/model/assignmentTargetKindSchema.ts"
import { stringSchemaId } from "#src/utils/valibot/stringSchema.ts"

export const assignmentUrlQuerySchema = a.object({
  orgId: a.optional(stringSchemaId),
  teamId: a.optional(stringSchemaId),
  projectId: a.optional(stringSchemaId),
  noteId: a.optional(stringSchemaId),
  assignmentKind: a.optional(a.union([assignmentTargetKindSchema, a.literal("unassigned")])),
  assignmentId: a.optional(stringSchemaId),
})

export type AssignmentUrlQuery = a.InferOutput<typeof assignmentUrlQuerySchema>
