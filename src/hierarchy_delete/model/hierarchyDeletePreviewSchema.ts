import * as a from "valibot"
import { hierarchyDeleteCountsSchema } from "#src/hierarchy_delete/model/hierarchyDeleteCountsSchema.ts"
import { hierarchyDeleteResolvedRootSchema } from "#src/hierarchy_delete/model/hierarchyDeleteResolvedRootSchema.ts"
import { hierarchyDeleteScopeSchema } from "#src/hierarchy_delete/model/hierarchyDeleteScopeSchema.ts"

export const hierarchyDeletePreviewSchema = a.object({
  root: hierarchyDeleteResolvedRootSchema,
  counts: hierarchyDeleteCountsSchema,
  fingerprint: a.string(),
  isTruncated: a.boolean(),
  scope: hierarchyDeleteScopeSchema,
})

export type HierarchyDeletePreview = a.InferOutput<typeof hierarchyDeletePreviewSchema>
