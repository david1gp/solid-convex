import * as a from "valibot"
import { assignmentFields } from "#src/assignment/model/assignmentFields.ts"
import { fileDataUnuploadedSchemaFields } from "#src/file/model/FileDataUnuploaded.ts"
import { fileDataUploadedSchemaFields } from "#src/file/model/FileDataUploaded.ts"
import { resourceIdSchema } from "#src/resource/model/resourceIdSchema.ts"
import { fieldsSchemaCreatedAtUpdatedAtDeletedAt } from "#src/utils/data/fieldsSchemaCreatedAtUpdatedAtDeletedAt.ts"

export const fileSchemaFields = {
  // meta
  resourceId: a.optional(resourceIdSchema),
  ...assignmentFields,
  // data
  ...fileDataUnuploadedSchemaFields,
  // uploaded
  ...fileDataUploadedSchemaFields,
} as const

export const fileDataSchema = a.object(fileSchemaFields)

export const fileSchema = a.object({
  ...fileSchemaFields,
  ...fieldsSchemaCreatedAtUpdatedAtDeletedAt,
})
