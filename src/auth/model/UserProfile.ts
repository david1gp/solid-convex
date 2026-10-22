import { v } from "convex/values"
import * as a from "valibot"
import { userDataSchemaFields } from "#src/auth/model/userDataSchemaFields.ts"
import { orgRoleSchema } from "#src/org/org_model_field/orgRole.ts"
import { valibotObjectToConvexFields } from "#src/utils/convex/valibotToConvex.ts"
import { fieldsSchemaCreatedAtUpdatedAtDeletedAt } from "#src/utils/data/fieldsSchemaCreatedAtUpdatedAtDeletedAt.ts"
import { stringSchemaId } from "#src/utils/valibot/stringSchema.ts"

export const userProfileSchema = a.object({
  userId: stringSchemaId,
  ...userDataSchemaFields,
  orgHandle: a.optional(a.string()),
  orgRole: a.optional(orgRoleSchema),
  ...fieldsSchemaCreatedAtUpdatedAtDeletedAt,
})

export type UserProfile = a.InferOutput<typeof userProfileSchema>

export const userProfileValidator = v.object(valibotObjectToConvexFields(userProfileSchema))
