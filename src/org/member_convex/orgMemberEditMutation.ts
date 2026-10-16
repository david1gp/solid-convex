import { v } from "convex/values"
import * as a from "valibot"
import { type MutationCtx, mutation } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import type { DocOrgMember, IdOrgMember } from "#src/org/member_convex/IdOrgMember.ts"
import { orgMemberDataSchemaFields } from "#src/org/member_model/OrgMemberSchema.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authMutationResult } from "#src/utils/convex_backend/authMutationResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"
import { nowIso } from "#utils/date/nowIso.js"

export type OrgMemberEditValidatorType = typeof orgMemberEditValidator.type

export const orgMemberEditFields = valibotToConvex({
  memberId: a.string(),
  orgHandle: orgMemberDataSchemaFields.orgHandle,
  role: a.optional(orgMemberDataSchemaFields.role),
})

export const orgMemberEditValidator = v.object(orgMemberEditFields)

export const orgMemberEditMutation = mutation({
  args: createTokenValidator(orgMemberEditFields),
  handler: async (ctx, args) => authMutationResult(ctx, args, orgMemberEditFn),
})

export async function orgMemberEditFn(ctx: MutationCtx, args: OrgMemberEditValidatorType): PromiseResult<null> {
  const op = "orgMemberEditFn"

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
  const { orgHandle, memberId, ...partial } = args
  const patch: Partial<DocOrgMember> = partial
  patch.updatedAt = nowIso()

  await ctx.db.patch("orgMembers", args.memberId as IdOrgMember, patch)
  return createResult(null)
}
