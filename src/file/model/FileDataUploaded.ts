import { v } from "convex/values"
import * as a from "valibot"
import { fileIdSchema } from "#src/file/model_field/fileIdSchema.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { stringSchemaUrl } from "#src/utils/valibot/stringSchema.ts"

export type FileDataUploaded = a.InferOutput<typeof fileDataUploadedSchema>

export const fileDataUploadedSchemaFields = {
  fileId: fileIdSchema,
  url: stringSchemaUrl,
} as const

export const fileDataUploadedSchema = a.object(fileDataUploadedSchemaFields)

export const fileDataUploadedConvexFields = valibotToConvex(fileDataUploadedSchemaFields)

export const fileDataUploadedValidator = v.object(fileDataUploadedConvexFields)
