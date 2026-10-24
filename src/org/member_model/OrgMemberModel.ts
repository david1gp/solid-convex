import * as a from "valibot"
import { orgMemberDataSchema, orgMemberSchema } from "#src/org/member_model/OrgMemberSchema.ts"

export type OrgMemberDataModel = a.InferOutput<typeof orgMemberDataSchema>

export type OrgMemberModel = a.InferOutput<typeof orgMemberSchema>
