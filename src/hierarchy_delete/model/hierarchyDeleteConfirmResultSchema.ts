import * as a from "valibot"
import { hierarchyDeleteCountsSchema } from "#src/hierarchy_delete/model/hierarchyDeleteCountsSchema.ts"
import { hierarchyDeleteJobStatusSchema } from "#src/hierarchy_delete/model/hierarchyDeleteJobStatusSchema.ts"
import { hierarchyDeleteResolvedRootSchema } from "#src/hierarchy_delete/model/hierarchyDeleteResolvedRootSchema.ts"

export const hierarchyDeleteConfirmResultSchema = a.object({
  jobId: a.string(),
  status: hierarchyDeleteJobStatusSchema,
  root: hierarchyDeleteResolvedRootSchema,
  counts: hierarchyDeleteCountsSchema,
  fingerprint: a.string(),
})

export type HierarchyDeleteConfirmResult = a.InferOutput<typeof hierarchyDeleteConfirmResultSchema>
