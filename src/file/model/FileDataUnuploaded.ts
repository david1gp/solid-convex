import { v } from "convex/values"
import * as a from "valibot"
import { languageOrNoneSchema } from "#src/app/i18n/language.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { stringSchemaUrl } from "#src/utils/valibot/stringSchema.ts"
import { intSchemaMin0 } from "#utils/valibot/intSchema.js"

export type FileDataUnuploaded = a.InferOutput<typeof fileDataUnaploadedSchema>

export const fileDataUnuploadedSchemaFields = {
  displayName: stringSchemaUrl,
  // technical data
  fileSize: intSchemaMin0,
  contentType: a.string(),
  // image
  imageWidth: a.optional(intSchemaMin0),
  imageHeight: a.optional(intSchemaMin0),
  // language
  language: a.optional(languageOrNoneSchema),
} as const

export const fileDataUnaploadedSchema = a.object(fileDataUnuploadedSchemaFields)

// Keep the existing Convex input shape: language is validated by the model
// schema but is not part of this helper's accepted Convex shape.
export const fileDataUnuploadedConvexFields = valibotToConvex({
  displayName: fileDataUnuploadedSchemaFields.displayName,
  fileSize: fileDataUnuploadedSchemaFields.fileSize,
  contentType: fileDataUnuploadedSchemaFields.contentType,
  imageWidth: fileDataUnuploadedSchemaFields.imageWidth,
  imageHeight: fileDataUnuploadedSchemaFields.imageHeight,
})

export const fileDataUnuploadedValidator = v.object(fileDataUnuploadedConvexFields)
