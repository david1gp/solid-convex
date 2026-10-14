import { v } from "convex/values"
import * as a from "valibot"
import { type MutationCtx, mutation } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import { vIdUser } from "#src/auth/convex/vIdUser.ts"
import type { IdOrgMember } from "#src/org/member_convex/IdOrgMember.ts"
import { orgMemberDataSchemaFields } from "#src/org/member_model/OrgMemberSchema.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authCredentialResolve } from "#src/utils/convex_backend/authCredentialResolve.ts"
import { nowIso } from "#utils/date/nowIso.js"

export type OrgMemberCreateValidatorType = typeof orgMemberCreateValidator.type

export const orgMemberCreateFields = {
  ...valibotToConvex({
    token: a.string(),
    orgHandle: orgMemberDataSchemaFields.orgHandle,
    role: orgMemberDataSchemaFields.role,
  }),
  userId: vIdUser,
} as const

export const orgMemberCreateValidator = v.object(orgMemberCreateFields)

export const orgMemberCreateMutation = mutation({
  args: orgMemberCreateValidator,
  handler: orgMemberCreateFn,
})

export async function orgMemberCreateFn(
  ctx: MutationCtx,
  args: OrgMemberCreateValidatorType,
): PromiseResult<IdOrgMember> {
  const op = "orgMemberCreateFn"

  const credentialResult = await authCredentialResolve(ctx, args.token)
  if (!credentialResult.success) {
    console.info(credentialResult)
    return credentialResult
  }
  const invitedBy = credentialResult.data.userId

  const user = await ctx.db.get("users", args.userId)
  if (!user) {
    const errorMessage = "user not found"
    console.info(op, errorMessage, args.userId)
    return createResultError(op, errorMessage, args.userId)
  }

  const org = await ctx.db
    .query("orgs")
    .withIndex("orgHandle", (q) => q.eq("orgHandle", args.orgHandle))
    .unique()
  if (!org) {
    return createResultError(op, "Organization not found", args.orgHandle)
  }
  if (org.deleting) {
    return createResultError(op, "Organization is currently being deleted")
  }

  const now = nowIso()
  const orgMemberId = await ctx.db.insert("orgMembers", {
    orgId: org._id,
    orgHandle: org.orgHandle,
    userId: args.userId,
    role: args.role,
    invitedBy: invitedBy,
    createdAt: now,
    updatedAt: now,
  })
  return createResult(orgMemberId)
}
