import { v } from "convex/values"
import * as a from "valibot"
import { type QueryCtx, query } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import { docOrgMemberToModel } from "#src/org/member_convex/docOrgMemberToModel.ts"
import type { IdOrgMember } from "#src/org/member_convex/IdOrgMember.ts"
import type { OrgMemberModel } from "#src/org/member_model/OrgMemberModel.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authQueryResult } from "#src/utils/convex_backend/authQueryResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"

export const orgMemberGetFields = valibotToConvex({
  orgHandle: a.string(),
  memberId: a.string(),
  updatedAt: a.optional(a.string()),
})

export type OrgMemberGetValidatorType = typeof orgMemberGetValidator.type
export const orgMemberGetValidator = v.object(orgMemberGetFields)

export const orgMemberGetQuery = query({
  args: createTokenValidator(orgMemberGetFields),
  handler: async (ctx, args) => {
    return await authQueryResult(ctx, args, orgMemberGetFn)
  },
})

export async function orgMemberGetFn(
  ctx: QueryCtx,
  args: OrgMemberGetValidatorType,
): PromiseResult<OrgMemberModel | null> {
  const op = "orgMemberGetFn"

  const org = await ctx.db
    .query("orgs")
    .withIndex("orgHandle", (q) => q.eq("orgHandle", args.orgHandle))
    .unique()
  if (!org) {
    return createResultError(op, "Organization not found", args.orgHandle)
  }

  const member = await ctx.db.get("orgMembers", args.memberId as IdOrgMember)
  if (!member || member.orgId !== org._id) {
    return createResultError(op, "Org member not found", args.memberId)
  }
  if (args.updatedAt && args.updatedAt === member.updatedAt) {
    return createResult(null)
  }
  return createResult(docOrgMemberToModel(member))
}
