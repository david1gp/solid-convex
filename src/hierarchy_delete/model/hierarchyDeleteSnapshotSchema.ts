import * as a from "valibot"
import { hierarchyDeleteCountsSchema } from "#src/hierarchy_delete/model/hierarchyDeleteCountsSchema.ts"
import { hierarchyDeleteScopeSchema } from "#src/hierarchy_delete/model/hierarchyDeleteScopeSchema.ts"
import { hierarchyDeleteTargetKindSchema } from "#src/hierarchy_delete/model/hierarchyDeleteTargetKindSchema.ts"
import { fieldsSchemaCreatedAtUpdatedAt } from "#src/utils/data/fieldsSchemaCreatedAtUpdatedAt.ts"

export const hierarchyDeleteSnapshotSchema = a.object({
  rootKind: hierarchyDeleteTargetKindSchema,
  rootId: a.string(),
  fingerprint: a.string(),
  counts: hierarchyDeleteCountsSchema,
  scope: hierarchyDeleteScopeSchema,
  isTruncated: a.boolean(),
  ...fieldsSchemaCreatedAtUpdatedAt,
})

export type HierarchyDeleteSnapshot = a.InferOutput<typeof hierarchyDeleteSnapshotSchema>
