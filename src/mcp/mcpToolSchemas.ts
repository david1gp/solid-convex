import * as a from "valibot"
import { apiKeyExpiryPresetSchema } from "#src/auth/model/apiKeyExpiryPreset.ts"
import { apiKeyNameSchema } from "#src/auth/model/apiKeyNameSchema.ts"
import { languageSchema } from "#src/app/i18n/language.ts"
import { orgRoleSchema } from "#src/org/org_model_field/orgRole.ts"
import { resourceTypeSchema } from "#src/resource/model_field/resourceType.ts"
import { visibilitySchema } from "#src/resource/model_field/visibility.ts"

const mcpAssignmentTargetSchema = a.variant("kind", [
  a.object({ kind: a.literal("organization"), id: a.string() }),
  a.object({ kind: a.literal("team"), id: a.string() }),
  a.object({ kind: a.literal("project"), id: a.string() }),
  a.object({ kind: a.literal("note"), id: a.string() }),
])

const stringSchema = a.string()

export const mcpPaginationOptsSchema = a.optional(
  a.object({
    numItems: a.pipe(a.number(), a.integer(), a.minValue(1), a.maxValue(100)),
    cursor: a.nullable(a.string()),
  }),
)

export const mcpAssignmentSchema = a.optional(a.nullable(mcpAssignmentTargetSchema))

const mcpNullableIdSchema = a.optional(a.nullable(stringSchema))

export const mcpToolSchemas = {
  paginationOpts: mcpPaginationOptsSchema,
  orgHandle: stringSchema,
  orgHandleOptional: a.optional(stringSchema),
  orgIdOptional: a.optional(stringSchema),
  teamIdOptional: a.optional(stringSchema),
  projectIdOptional: a.optional(stringSchema),
  memberId: stringSchema,
  invitationCode: stringSchema,
  updatedAtOptional: a.optional(stringSchema),
  orgRole: orgRoleSchema,
  orgRoleOptional: a.optional(orgRoleSchema),
  language: languageSchema,
  languageOptional: a.optional(languageSchema),
  languageOrNoneOptional: a.optional(a.picklist(["en", "ru", "tj", "none"])),
  resourceTypeOptional: a.optional(resourceTypeSchema),
  visibilityOptional: a.optional(visibilitySchema),
  apiKeyName: apiKeyNameSchema,
  apiKeyExpiryPresetOptional: a.optional(apiKeyExpiryPresetSchema),
  apiKeyId: stringSchema,
  assignment: mcpAssignmentSchema,
  nullableId: mcpNullableIdSchema,
  nonNegativeInt: a.pipe(a.number(), a.integer(), a.minValue(0), a.maxValue(9007199254740991)),
  nonNegativeIntOptional: a.optional(a.pipe(a.number(), a.integer(), a.minValue(0), a.maxValue(9007199254740991))),
  arrayOfStringOptional: a.optional(a.array(stringSchema)),
} as const
