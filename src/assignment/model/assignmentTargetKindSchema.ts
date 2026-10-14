import * as a from "valibot"

export const assignmentTargetKindSchema = a.picklist(["organization", "team", "project", "note"])

export type AssignmentTargetKind = a.InferOutput<typeof assignmentTargetKindSchema>
