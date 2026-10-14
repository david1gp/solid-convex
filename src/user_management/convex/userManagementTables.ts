import { defineTable } from "convex/server"
import { userProjectionSchema } from "#src/user_management/model/userProjectionSchema.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"

export const userManagementTables = {
  userProjections: defineTable({
    ...valibotToConvex(userProjectionSchema.entries),
  })
    .index("userId", ["userId"])
    .index("organizationId", ["organizationId"])
    .index("orgIdAndUserId", ["organizationId", "userId"]),
} as const
