import { v } from "convex/values"
import * as a from "valibot"
import { type QueryCtx, query } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import { docUserToUserProfile } from "#src/auth/convex/user/docUserToUserProfile.ts"
import { docOrgMemberToModel } from "#src/org/member_convex/docOrgMemberToModel.ts"
import type { OrgMemberProfile } from "#src/org/member_model/OrgMemberProfile.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authQueryResult } from "#src/utils/convex_backend/authQueryResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"
import { paginationDefaultOptions } from "#src/utils/convex_backend/paginationDefaultOptions.ts"
import { paginationOptsValidator } from "#src/utils/convex_backend/paginationOptsValidator.ts"
import type { PaginationResultType } from "#src/utils/convex_backend/paginationResultType.ts"

export type OrgMembersListValidatorType = typeof orgMembersListValidator.type

export const orgMembersListFields = {
  ...valibotToConvex({ orgHandle: a.string() }),
  paginationOpts: paginationOptsValidator,
} as const

export const orgMembersListValidator = v.object(orgMembersListFields)

export const orgMembersListQuery = query({
  args: createTokenValidator(orgMembersListFields),
  handler: async (ctx, args) => await authQueryResult(ctx, args, orgMemberListFn),
})

export async function orgMemberListFn(
  ctx: QueryCtx,
  args: OrgMembersListValidatorType,
): PromiseResult<PaginationResultType<OrgMemberProfile>> {
  const op = "orgMemberListFn"

  const org = await ctx.db
    .query("orgs")
    .withIndex("orgHandle", (q) => q.eq("orgHandle", args.orgHandle))
    .unique()
  if (!org) {
    return createResultError(op, "Organization not found", args.orgHandle)
  }

  const members = await ctx.db
    .query("orgMembers")
    .withIndex("orgId", (q) => q.eq("orgId", org._id))
    .paginate(args.paginationOpts ?? paginationDefaultOptions)

  const memberProfiles = []
  for (const member of members.page) {
    const user = await ctx.db.get("users", member.userId)
    if (!user) return createResultError(op, "User not found", member.userId)
    const model = docOrgMemberToModel(member)
    memberProfiles.push({
      ...model,
      profile: docUserToUserProfile(user, org.orgHandle, member.role),
    })
  }

  return createResult({
    page: memberProfiles,
    isDone: members.isDone,
    continueCursor: members.continueCursor,
  })
}
