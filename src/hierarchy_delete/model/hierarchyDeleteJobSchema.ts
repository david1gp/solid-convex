import * as a from "valibot"
import { hierarchyDeleteCountsSchema } from "#src/hierarchy_delete/model/hierarchyDeleteCountsSchema.ts"
import { hierarchyDeleteJobStatusSchema } from "#src/hierarchy_delete/model/hierarchyDeleteJobStatusSchema.ts"
import { hierarchyDeleteScopeSchema } from "#src/hierarchy_delete/model/hierarchyDeleteScopeSchema.ts"
import { hierarchyDeleteTargetKindSchema } from "#src/hierarchy_delete/model/hierarchyDeleteTargetKindSchema.ts"
import { hierarchyDeleteWorkerPhaseSchema } from "#src/hierarchy_delete/model/hierarchyDeleteWorkerPhaseSchema.ts"
import { fieldsSchemaCreatedAtUpdatedAt } from "#src/utils/data/fieldsSchemaCreatedAtUpdatedAt.ts"

export const hierarchyDeleteJobSchema = a.object({
  jobId: a.string(),
  rootKind: hierarchyDeleteTargetKindSchema,
  rootId: a.string(),
  rootName: a.optional(a.string()),
  orgHandle: a.optional(a.string()),
  fingerprint: a.string(),
  status: hierarchyDeleteJobStatusSchema,
  phase: a.optional(hierarchyDeleteWorkerPhaseSchema),
  cursor: a.optional(a.number()),
  isRetryable: a.optional(a.boolean()),
  counts: hierarchyDeleteCountsSchema,
  scope: hierarchyDeleteScopeSchema,
  requestedByUserId: a.string(),
  error: a.optional(a.string()),
  ...fieldsSchemaCreatedAtUpdatedAt,
})

export type HierarchyDeleteJob = a.InferOutput<typeof hierarchyDeleteJobSchema>
