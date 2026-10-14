import { defineTable } from "convex/server"
import { hierarchyDeleteMarkerSchemaFields } from "#src/hierarchy_delete/model/hierarchyDeleteMarkerSchemaFields.ts"
import { vIdOrg } from "#src/org/org_convex/vIdOrg.ts"
import { teamDataSchema } from "#src/team/model/teamDataSchema.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { fieldsSchemaCreatedAtUpdatedAt } from "#src/utils/data/fieldsSchemaCreatedAtUpdatedAt.ts"

export const teamTables = {
  teams: defineTable({
    orgId: vIdOrg,
    ...valibotToConvex(teamDataSchema.entries),
    ...valibotToConvex(fieldsSchemaCreatedAtUpdatedAt),
    ...valibotToConvex(hierarchyDeleteMarkerSchemaFields),
  }).index("orgId", ["orgId"]),
} as const
