import type { Result } from "#result"
import type { HierarchyDeleteConfirmPayload } from "#src/hierarchy_delete/ui/hierarchyDeleteConfirmPayloadSchema.ts"

export type HierarchyDeleteConfirmAction = (payload: HierarchyDeleteConfirmPayload) => Promise<Result<unknown>>
