import * as a from "valibot"
import { orgRoleSchema } from "#src/org/org_model_field/orgRole.ts"
import { fieldsSchemaCreatedAtUpdatedAt } from "#src/utils/data/fieldsSchemaCreatedAtUpdatedAt.ts"
import { stringSchemaId } from "#src/utils/valibot/stringSchema.ts"

export const orgMemberDataSchemaFields = {
  memberId: stringSchemaId,
  orgHandle: stringSchemaId,
  userId: stringSchemaId,
  role: orgRoleSchema,
  invitedBy: stringSchemaId,
} as const

export const orgMemberSchemaFields = {
  ...orgMemberDataSchemaFields,
  ...fieldsSchemaCreatedAtUpdatedAt,
} as const

export const orgMemberDataSchema = a.object(orgMemberDataSchemaFields)

export const orgMemberSchema = a.object(orgMemberSchemaFields)
