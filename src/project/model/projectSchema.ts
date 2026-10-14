import * as a from "valibot"
import type { Id } from "#convex/_generated/dataModel.js"
import { hierarchyDeleteMarkerSchemaFields } from "#src/hierarchy_delete/model/hierarchyDeleteMarkerSchemaFields.ts"
import { projectDataSchema } from "#src/project/model/projectDataSchema.ts"
import { fieldsSchemaCreatedAtUpdatedAt } from "#src/utils/data/fieldsSchemaCreatedAtUpdatedAt.ts"

export const projectSchema = a.object({
  ...projectDataSchema.entries,
  ...fieldsSchemaCreatedAtUpdatedAt,
  ...hierarchyDeleteMarkerSchemaFields,
  projectId: a.custom<Id<"projects">>((input) => typeof input === "string" && input.length > 0),
  teamId: a.custom<Id<"teams">>((input) => typeof input === "string" && input.length > 0),
  orgId: a.custom<Id<"orgs">>((input) => typeof input === "string" && input.length > 0),
})

export type Project = a.InferOutput<typeof projectSchema>
