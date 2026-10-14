import { v } from "convex/values"
import { vAssignmentTarget } from "#src/assignment/convex/vAssignmentTarget.ts"

export const assignmentTableFields = {
  assignment: v.optional(vAssignmentTarget),
  orgId: v.optional(v.string()),
  teamId: v.optional(v.string()),
  projectId: v.optional(v.string()),
  noteId: v.optional(v.string()),
} as const
