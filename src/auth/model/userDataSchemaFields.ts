import * as a from "valibot"
import { userRoleSchema } from "#src/auth/model_field/userRole.ts"
import { emailSchema } from "#src/utils/valibot/emailSchema.ts"
import { handleSchema } from "#src/utils/valibot/handleSchema.ts"
import { stringSchema0to500, stringSchemaName } from "#src/utils/valibot/stringSchema.ts"
import { dateTimeSchema } from "#utils/valibot/dateTimeSchema.js"

export const userDataSchemaFields = {
  name: stringSchemaName,
  username: a.optional(handleSchema),
  image: a.optional(stringSchema0to500),
  bio: a.optional(a.string()),
  url: a.optional(a.string()),
  email: a.optional(emailSchema),
  emailVerifiedAt: a.optional(dateTimeSchema),
  role: userRoleSchema,
  roles: a.optional(a.array(userRoleSchema)),
} as const
