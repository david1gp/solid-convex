import * as a from "valibot"
import { userProfileSchema } from "#src/auth/model/UserProfile.ts"
import { orgMemberSchemaFields } from "#src/org/member_model/OrgMemberSchema.ts"

export const orgMemberProfileSchema = a.object({
  ...orgMemberSchemaFields,
  profile: userProfileSchema,
})

export type OrgMemberProfile = a.InferOutput<typeof orgMemberProfileSchema>
