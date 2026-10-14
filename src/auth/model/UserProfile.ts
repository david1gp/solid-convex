import { v } from "convex/values"
import * as a from "valibot"
import { userDataSchemaFields } from "#src/auth/model/userDataSchemaFields.ts"
import type { UserRole } from "#src/auth/model_field/userRole.ts"
import { type OrgRole, orgRoleSchema } from "#src/org/org_model_field/orgRole.ts"
import { fieldsSchemaCreatedAtUpdatedAtDeletedAt } from "#src/utils/data/fieldsSchemaCreatedAtUpdatedAtDeletedAt.ts"
import type { HasCreatedAtUpdatedDeletedAt } from "#src/utils/data/HasCreatedAtUpdatedDeletedAt.ts"
import { valibotObjectToConvexFields } from "#src/utils/convex/valibotToConvex.ts"
import { stringSchemaId } from "#src/utils/valibot/stringSchema.ts"

export interface UserProfile extends HasCreatedAtUpdatedDeletedAt {
  userId: string
  name: string
  username?: string
  image?: string
  bio?: string
  url?: string
  email?: string
  emailVerifiedAt?: string
  role: UserRole
  roles?: UserRole[]
  orgHandle?: string
  orgRole?: OrgRole
}

export const userProfileSchema = a.object({
  userId: stringSchemaId,
  ...userDataSchemaFields,
  orgHandle: a.optional(a.string()),
  orgRole: a.optional(orgRoleSchema),
  ...fieldsSchemaCreatedAtUpdatedAtDeletedAt,
})

function types1(a: a.InferOutput<typeof userProfileSchema>): UserProfile {
  return a
}

export const userProfileValidator = v.object(valibotObjectToConvexFields(userProfileSchema))
