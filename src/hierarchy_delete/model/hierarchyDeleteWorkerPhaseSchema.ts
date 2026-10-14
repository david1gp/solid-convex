import * as a from "valibot"

export const hierarchyDeleteWorkerPhaseSchema = a.picklist([
  "delete_r2_objects",
  "delete_file_records",
  "delete_resources",
  "delete_notes",
  "delete_projects",
  "cleanup_teams_zitadel",
  "delete_teams",
  "delete_org_members",
  "delete_org_roots",
  "completed",
])

export type HierarchyDeleteWorkerPhase = a.InferOutput<typeof hierarchyDeleteWorkerPhaseSchema>
