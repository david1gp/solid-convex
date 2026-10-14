export interface HierarchyBatchDeleteResult {
  readonly deletedCount: number
  readonly pendingSameItem: boolean
  readonly hasMore: boolean
  readonly processedCount: number
}
