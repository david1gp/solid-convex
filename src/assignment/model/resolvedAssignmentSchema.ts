import * as a from "valibot"
import { assignmentTargetSchema } from "#src/assignment/model/assignmentTargetSchema.ts"
import { stringSchemaId } from "#src/utils/valibot/stringSchema.ts"

export const resolvedAssignmentSchema = a.object({
  assignment: a.optional(assignmentTargetSchema),
  orgId: a.optional(stringSchemaId),
  teamId: a.optional(stringSchemaId),
  projectId: a.optional(stringSchemaId),
  noteId: a.optional(stringSchemaId),
})

export type ResolvedAssignment = a.InferOutput<typeof resolvedAssignmentSchema>
