import * as a from "valibot"
import { hierarchyDeleteTargetSchema } from "#src/hierarchy_delete/model/hierarchyDeleteTargetSchema.ts"

export const hierarchyDeleteConfirmPayloadSchema = a.object({
  target: hierarchyDeleteTargetSchema,
  fingerprint: a.string(),
  confirmedNameOrDelete: a.string(),
})

export type HierarchyDeleteConfirmPayload = a.InferOutput<typeof hierarchyDeleteConfirmPayloadSchema>
