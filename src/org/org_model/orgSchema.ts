import * as a from "valibot"
import { hierarchyDeleteMarkerSchemaFields } from "#src/hierarchy_delete/model/hierarchyDeleteMarkerSchemaFields.ts"
import type { DocOrg } from "#src/org/org_convex/IdOrg.ts"
import type { OrgModel } from "#src/org/org_model/OrgModel.ts"
import { orgHandleSchema } from "#src/org/org_model_field/orgHandleSchema.ts"
import { fieldsSchemaCreatedAtUpdatedAt } from "#src/utils/data/fieldsSchemaCreatedAtUpdatedAt.ts"
import { stringSchemaDescription, stringSchemaName, stringSchemaUrl } from "#src/utils/valibot/stringSchema.ts"

export const orgDataSchemaFields = {
  orgHandle: orgHandleSchema,
  // data
  name: a.optional(stringSchemaName),
  description: a.optional(stringSchemaDescription),
  url: a.optional(stringSchemaUrl),
  image: a.optional(stringSchemaUrl),
  ...hierarchyDeleteMarkerSchemaFields,
} as const

export const orgDataSchema = a.object(orgDataSchemaFields)

export const orgDataPartialSchema = a.partial(orgDataSchema)

export const orgSchema = a.object({
  ...orgDataSchemaFields,
  ...fieldsSchemaCreatedAtUpdatedAt,
})

function types1(m: DocOrg): OrgModel {
  return m
}
