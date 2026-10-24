import * as a from "valibot"
import { ttc } from "#src/app/i18n/ttc.ts"
import { fileSchema } from "#src/file/model/fileSchema.ts"
import { resourceDataSchemaFields } from "#src/resource/model/resourceSchema.ts"
import type { FormFieldConfig } from "#src/ui/form/formFieldConfigs.ts"
import { formFieldConfigs } from "#src/ui/form/formFieldConfigs.ts"
import { inputMaxLengthDefault } from "#src/utils/valibot/inputMaxLengthDefault.ts"

export type ResourceFormField = keyof typeof resourceFormField

export const resourceFormField = {
  resourceId: "resourceId",
  // 1. General
  name: "name",
  description: "description",
  type: "type",
  // 2. Display
  visibility: "visibility",
  image: "image",
  language: "language",
  // Files
  files: "files",
} as const

export const resourceFormConfig = {
  resourceId: {
    name: "resourceId",
    label: () => ttc("Resource ID"),
    placeholder: () => ttc("A unique identifier, visible in the url, ex. resource-abc-123"),
    required: true,
    maxLength: inputMaxLengthDefault,
    schema: resourceDataSchemaFields.resourceId,
  } as const satisfies FormFieldConfig,

  // 1. General
  name: {
    ...formFieldConfigs.name,
    label: () => ttc("Name"),
    placeholder: () => ttc("Enter resource name"),
    required: true,
    schema: resourceDataSchemaFields.name,
  } as const satisfies FormFieldConfig,

  description: {
    ...formFieldConfigs.description,
    schema: resourceDataSchemaFields.description,
  } as const satisfies FormFieldConfig,

  type: {
    name: "type",
    label: () => ttc("Type"),
    placeholder: () => ttc("Select resource type"),
    schema: resourceDataSchemaFields.type,
  } as const satisfies FormFieldConfig,

  language: {
    name: "language",
    label: () => ttc("Language"),
    placeholder: () => ttc("Select language"),
    schema: resourceDataSchemaFields.language,
  } as const satisfies FormFieldConfig,

  // 2. Display
  visibility: {
    name: "visibility",
    label: () => ttc("Visibility"),
    placeholder: () => ttc("Select visibility"),
    schema: resourceDataSchemaFields.visibility,
  } as const satisfies FormFieldConfig,

  image: {
    ...formFieldConfigs.image,
    schema: resourceDataSchemaFields.image,
  } as const satisfies FormFieldConfig,

  files: {
    name: "files",
    label: () => ttc("Files"),
    placeholder: () => ttc("Upload files for this resource"),
    required: false,
    schema: a.array(fileSchema),
  } as const satisfies FormFieldConfig,
} as const satisfies Record<ResourceFormField, FormFieldConfig>
