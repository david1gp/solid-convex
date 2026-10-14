import { defineTable } from "convex/server"
import { v } from "convex/values"
import { hierarchyDeleteMarkerSchemaFields } from "#src/hierarchy_delete/model/hierarchyDeleteMarkerSchemaFields.ts"
import { vIdOrg } from "#src/org/org_convex/vIdOrg.ts"
import { vIdProject } from "#src/project/convex/vIdProject.ts"
import { vIdTeam } from "#src/team/convex/vIdTeam.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { fieldsSchemaCreatedAtUpdatedAt } from "#src/utils/data/fieldsSchemaCreatedAtUpdatedAt.ts"

export const noteTables = {
  notes: defineTable({
    projectId: vIdProject,
    teamId: vIdTeam,
    orgId: vIdOrg,
    title: v.string(),
    content: v.string(),
    ...valibotToConvex(fieldsSchemaCreatedAtUpdatedAt),
    ...valibotToConvex(hierarchyDeleteMarkerSchemaFields),
  })
    .index("projectId", ["projectId"])
    .index("teamId", ["teamId"])
    .index("orgId", ["orgId"]),
} as const
