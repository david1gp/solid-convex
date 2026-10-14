import * as a from "valibot"

export const hierarchyDeleteJobStatusSchema = a.picklist(["pending", "in_progress", "completed", "failed", "error"])

export type HierarchyDeleteJobStatus = a.InferOutput<typeof hierarchyDeleteJobStatusSchema>
