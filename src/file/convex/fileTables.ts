import { defineTable } from "convex/server"
import * as a from "valibot"
import { assignmentTableFields } from "#src/assignment/convex/assignmentTableFields.ts"
import { vIdUser } from "#src/auth/convex/vIdUser.ts"
import { fileSchemaFields } from "#src/file/model/fileSchema.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { fieldsSchemaCreatedAtUpdatedAtDeletedAt } from "#src/utils/data/fieldsSchemaCreatedAtUpdatedAtDeletedAt.ts"
import { stringSchemaId } from "#src/utils/valibot/stringSchema.ts"

const fileMetaDataSchemaFields = {
  fileId: stringSchemaId,
  username: a.optional(stringSchemaId),
} as const

const fileTableDataSchemaFields = {
  ...fileMetaDataSchemaFields,
  ...fileSchemaFields,
} as const

export const fileTables = {
  files: defineTable({
    userId: vIdUser,
    ...valibotToConvex(fileTableDataSchemaFields),
    ...assignmentTableFields,
    ...valibotToConvex(fieldsSchemaCreatedAtUpdatedAtDeletedAt),
  })
    //
    .index("fileId", ["fileId"])
    .index("userId", ["userId"])
    .index("resourceId", ["resourceId"])
    .index("orgId", ["orgId"])
    .index("teamId", ["teamId"])
    .index("projectId", ["projectId"])
    .index("noteId", ["noteId"]),
} as const
