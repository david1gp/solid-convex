import * as a from "valibot"
import { hierarchyDeleteTargetKindSchema } from "#src/hierarchy_delete/model/hierarchyDeleteTargetKindSchema.ts"

export const hierarchyDeleteResolvedRootSchema = a.object({
  kind: hierarchyDeleteTargetKindSchema,
  id: a.string(),
  name: a.optional(a.string()),
  orgHandle: a.optional(a.string()),
})

export type HierarchyDeleteResolvedRoot = a.InferOutput<typeof hierarchyDeleteResolvedRootSchema>
