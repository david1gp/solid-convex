import * as a from "valibot"
import { hierarchyDeleteCountsSchema } from "#src/hierarchy_delete/model/hierarchyDeleteCountsSchema.ts"
import { hierarchyDeleteJobStatusSchema } from "#src/hierarchy_delete/model/hierarchyDeleteJobStatusSchema.ts"
import { hierarchyDeleteResolvedRootSchema } from "#src/hierarchy_delete/model/hierarchyDeleteResolvedRootSchema.ts"
import { hierarchyDeleteScopeSchema } from "#src/hierarchy_delete/model/hierarchyDeleteScopeSchema.ts"
import { hierarchyDeleteWorkerPhaseSchema } from "#src/hierarchy_delete/model/hierarchyDeleteWorkerPhaseSchema.ts"

export const hierarchyDeleteJobStateSchema = a.object({
  jobId: a.optional(a.string()),
  root: hierarchyDeleteResolvedRootSchema,
  counts: hierarchyDeleteCountsSchema,
  fingerprint: a.string(),
  scope: hierarchyDeleteScopeSchema,
  phase: hierarchyDeleteWorkerPhaseSchema,
  cursor: a.number(),
  status: hierarchyDeleteJobStatusSchema,
  isRetryable: a.boolean(),
  errorMessage: a.optional(a.string()),
})

export type HierarchyDeleteJobState = a.InferOutput<typeof hierarchyDeleteJobStateSchema>
