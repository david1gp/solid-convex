import * as a from "valibot"
import type { Id } from "#convex/_generated/dataModel.js"
import { hierarchyDeleteMarkerSchemaFields } from "#src/hierarchy_delete/model/hierarchyDeleteMarkerSchemaFields.ts"
import { teamDataSchema } from "#src/team/model/teamDataSchema.ts"
import { fieldsSchemaCreatedAtUpdatedAt } from "#src/utils/data/fieldsSchemaCreatedAtUpdatedAt.ts"

export const teamSchema = a.object({
  ...teamDataSchema.entries,
  ...fieldsSchemaCreatedAtUpdatedAt,
  ...hierarchyDeleteMarkerSchemaFields,
  teamId: a.custom<Id<"teams">>((input) => typeof input === "string" && input.length > 0),
  orgId: a.custom<Id<"orgs">>((input) => typeof input === "string" && input.length > 0),
})

export type Team = a.InferOutput<typeof teamSchema>
