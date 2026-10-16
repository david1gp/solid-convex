import { v } from "convex/values"
import * as a from "valibot"
import { internal } from "#convex/_generated/api.js"
import { type MutationCtx, mutation } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import { saveTokenIntoSessionReturnExpiresAtFn } from "#src/auth/convex/crud/saveTokenIntoSessionReturnExpiresAtMutation.ts"
import { docUserToUserProfile } from "#src/auth/convex/user/docUserToUserProfile.ts"
import type { UserSession } from "#src/auth/model/UserSession.ts"
import { loginMethod } from "#src/auth/model_field/loginMethod.ts"
import { createTokenResult } from "#src/auth/server/jwt_token/createTokenResult.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authMutationTokenToUserId } from "#src/utils/convex_backend/authMutationTokenToUserId.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"
import { createUserIdValidator } from "#src/utils/convex_backend/createUserIdValidator.ts"
import { nowIso } from "#utils/date/nowIso.js"

export const orgLeaveFields = valibotToConvex({ orgHandle: a.string() })

export const orgLeaveValidator = createUserIdValidator(orgLeaveFields)

export type OrgLeaveValidatorType = typeof orgLeaveValidator.type

export const orgLeaveMutation = mutation({
  args: createTokenValidator(orgLeaveFields),
  handler: async (ctx, args) => authMutationTokenToUserId(ctx, args, orgLeaveFn),
})

export async function orgLeaveFn(ctx: MutationCtx, args: OrgLeaveValidatorType): PromiseResult<UserSession> {
  const op = "orgLeaveFn"

  const org = await ctx.db
    .query("orgs")
    .withIndex("orgHandle", (q) => q.eq("orgHandle", args.orgHandle))
    .unique()
  if (!org) {
    return createResultError(op, "Organization not found", args.orgHandle)
  }

  const member = await ctx.db
    .query("orgMembers")
    .withIndex("userIdOrgId", (q) => q.eq("userId", args.userId).eq("orgId", org._id))
    .first()

  if (!member) {
    return createResultError(op, "Member not found", args.userId)
  }

  await ctx.db.delete("orgMembers", member._id)

  await ctx.runMutation(internal.org.orgCleanupIfEmptyInternalMutation, {
    orgHandle: args.orgHandle,
  })

  const user = await ctx.db.get("users", args.userId)
  if (!user) {
    return createResultError(op, "User not found", args.userId)
  }

  const tokenResult = await createTokenResult(args.userId, undefined, undefined)
  if (!tokenResult.success) {
    return tokenResult
  }
  const token = tokenResult.data

  const expiresAt = await saveTokenIntoSessionReturnExpiresAtFn(ctx, loginMethod.email, args.userId, token, nowIso())

  const userProfile = docUserToUserProfile(user, undefined, undefined)

  const userSession: UserSession = {
    token,
    profile: userProfile,
    hasPw: !!user.hashedPassword,
    signedInMethod: loginMethod.email,
    signedInAt: nowIso(),
    expiresAt,
  }

  return createResult(userSession)
}
