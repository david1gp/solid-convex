import * as a from "valibot"
import { languageSchema } from "#src/app/i18n/language.ts"
import { assignmentTargetSchema } from "#src/assignment/model/assignmentTargetSchema.ts"
import { fileSchema } from "#src/file/model/fileSchema.ts"
import { resourceTypeSchema } from "#src/resource/model_field/resourceType.ts"
import { visibilitySchema } from "#src/resource/model_field/visibility.ts"

export const resourceFormDraftCacheSchema = a.object({
  resource: a.object({
    resourceId: a.optional(a.string(), ""),
    assignment: a.optional(assignmentTargetSchema),
    name: a.optional(a.string(), ""),
    description: a.optional(a.string(), ""),
    type: a.optional(resourceTypeSchema),
    visibility: a.optional(visibilitySchema),
    image: a.optional(a.string(), ""),
    language: a.optional(languageSchema),
    createdAt: a.optional(a.string()),
    updatedAt: a.optional(a.string()),
  }),
  files: a.optional(a.array(fileSchema), []),
})

export type ResourceFormDraftCache = a.InferOutput<typeof resourceFormDraftCacheSchema>
