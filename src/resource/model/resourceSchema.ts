import * as a from "valibot"
import { languageSchema } from "#src/app/i18n/language.ts"
import { assignmentFields } from "#src/assignment/model/assignmentFields.ts"
import type { DocResource } from "#src/resource/convex/IdResource.ts"
import type { ResourceModel } from "#src/resource/model/ResourceModel.ts"
import { resourceIdSchema } from "#src/resource/model/resourceIdSchema.ts"
import { resourceTypeSchema } from "#src/resource/model_field/resourceType.ts"
import { visibilitySchema } from "#src/resource/model_field/visibility.ts"
import { fieldsSchemaCreatedAtUpdatedAtDeletedAt } from "#src/utils/data/fieldsSchemaCreatedAtUpdatedAtDeletedAt.ts"
import { stringSchemaDescription, stringSchemaName } from "#src/utils/valibot/stringSchema.ts"

export const resourceDataSchemaFields = {
  resourceId: resourceIdSchema,
  ...assignmentFields,
  // 1. General
  name: a.optional(stringSchemaName),
  description: a.optional(stringSchemaDescription),
  type: a.optional(resourceTypeSchema),
  // 2. Display
  visibility: a.optional(visibilitySchema),
  image: a.optional(a.string()),
  language: a.optional(languageSchema),
} as const

export const resourceDataSchema = a.object(resourceDataSchemaFields)

export type ResourceDataModel = a.InferOutput<typeof resourceDataSchema>

export const resourceSchema = a.object({
  ...resourceDataSchemaFields,
  ...fieldsSchemaCreatedAtUpdatedAtDeletedAt,
})

export function resourceDocToModel(m: DocResource): ResourceModel {
  return m
}
