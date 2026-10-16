import { v } from "convex/values"
import * as a from "valibot"
import { type MutationCtx, mutation } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import type { IdOrgMember } from "#src/org/member_convex/IdOrgMember.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authMutationResult } from "#src/utils/convex_backend/authMutationResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"

export type OrgMemberDeleteValidatorType = typeof orgMemberDeleteValidator.type

export const orgMemberDeleteFields = valibotToConvex({ memberId: a.string(), orgHandle: a.string() })

export const orgMemberDeleteValidator = v.object(orgMemberDeleteFields)

export const orgMemberDeleteMutation = mutation({
  args: createTokenValidator(orgMemberDeleteFields),
  handler: async (ctx, args) => authMutationResult(ctx, args, orgMemberDeleteFn),
})

export async function orgMemberDeleteFn(ctx: MutationCtx, args: OrgMemberDeleteValidatorType): PromiseResult<null> {
  const op = "orgMemberDeleteFn"

  const org = await ctx.db
    .query("orgs")
    .withIndex("orgHandle", (q) => q.eq("orgHandle", args.orgHandle))
    .unique()
  if (!org) {
    return createResultError(op, "Organization not found", args.orgHandle)
  }

  const member = await ctx.db.get("orgMembers", args.memberId as IdOrgMember)
  if (!member || member.orgId !== org._id) {
    return createResult(null) // idempotent
  }

  await ctx.db.delete("orgMembers", args.memberId as IdOrgMember)
  return createResult(null)
}
