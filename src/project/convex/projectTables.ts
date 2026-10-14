import { defineTable } from "convex/server"
import { hierarchyDeleteMarkerSchemaFields } from "#src/hierarchy_delete/model/hierarchyDeleteMarkerSchemaFields.ts"
import { vIdOrg } from "#src/org/org_convex/vIdOrg.ts"
import { projectDataSchema } from "#src/project/model/projectDataSchema.ts"
import { vIdTeam } from "#src/team/convex/vIdTeam.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { fieldsSchemaCreatedAtUpdatedAt } from "#src/utils/data/fieldsSchemaCreatedAtUpdatedAt.ts"

export const projectTables = {
  projects: defineTable({
    teamId: vIdTeam,
    orgId: vIdOrg,
    ...valibotToConvex(projectDataSchema.entries),
    ...valibotToConvex(fieldsSchemaCreatedAtUpdatedAt),
    ...valibotToConvex(hierarchyDeleteMarkerSchemaFields),
  })
    .index("teamId", ["teamId"])
    .index("orgId", ["orgId"]),
} as const
