import { v } from "convex/values"
import * as a from "valibot"
import { fileIdSchema } from "#src/file/model_field/fileIdSchema.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { stringSchemaUrl } from "#src/utils/valibot/stringSchema.ts"

export interface FileDataUploaded {
  fileId: string
  url: string
}

export const fileDataUploadedSchemaFields = {
  fileId: fileIdSchema,
  url: stringSchemaUrl,
} as const

export const fileDataUploadedSchema = a.object(fileDataUploadedSchemaFields)

export const fileDataUploadedConvexFields = valibotToConvex(fileDataUploadedSchemaFields)

export const fileDataUploadedValidator = v.object(fileDataUploadedConvexFields)

function types1(d: a.InferOutput<typeof fileDataUploadedSchema>): FileDataUploaded {
  return d
}

function types2(d: FileDataUploaded): a.InferOutput<typeof fileDataUploadedSchema> {
  return d
}

function types3(d: typeof fileDataUploadedValidator.type): FileDataUploaded {
  return d
}

function types4(d: FileDataUploaded): typeof fileDataUploadedValidator.type {
  return d
}
