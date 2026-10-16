import { v } from "convex/values"
import * as a from "valibot"
import { type LanguageOrNone, languageOrNoneSchema } from "#src/app/i18n/language.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { stringSchemaUrl } from "#src/utils/valibot/stringSchema.ts"
import { intSchemaMin0 } from "#utils/valibot/intSchema.js"

export interface FileDataUnuploaded {
  displayName: string
  // technical data
  fileSize: number
  contentType: string
  // image
  imageWidth?: number
  imageHeight?: number
  // language
  language?: LanguageOrNone
}

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

function types1(d: a.InferOutput<typeof fileDataUnaploadedSchema>): FileDataUnuploaded {
  return d
}

function types2(d: FileDataUnuploaded): a.InferOutput<typeof fileDataUnaploadedSchema> {
  return d
}

function types3(d: typeof fileDataUnuploadedValidator.type): FileDataUnuploaded {
  return d
}

function types4(d: FileDataUnuploaded): typeof fileDataUnuploadedValidator.type {
  return d
}
