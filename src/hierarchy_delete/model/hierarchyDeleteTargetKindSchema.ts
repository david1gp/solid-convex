import * as a from "valibot"

export const hierarchyDeleteTargetKindSchema = a.picklist(["org", "team", "project", "note"])

export type HierarchyDeleteTargetKind = a.InferOutput<typeof hierarchyDeleteTargetKindSchema>
