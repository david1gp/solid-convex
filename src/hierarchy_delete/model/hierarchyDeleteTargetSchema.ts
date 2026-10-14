import * as a from "valibot"
import { hierarchyDeleteTargetKindSchema } from "#src/hierarchy_delete/model/hierarchyDeleteTargetKindSchema.ts"

export const hierarchyDeleteTargetSchema = a.object({
  kind: hierarchyDeleteTargetKindSchema,
  orgId: a.optional(a.string()),
  orgHandle: a.optional(a.string()),
  teamId: a.optional(a.string()),
  projectId: a.optional(a.string()),
  noteId: a.optional(a.string()),
})

export type HierarchyDeleteTarget = a.InferOutput<typeof hierarchyDeleteTargetSchema>
