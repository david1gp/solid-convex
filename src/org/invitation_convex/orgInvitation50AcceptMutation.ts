import { v } from "convex/values"
import * as a from "valibot"
import { type MutationCtx, mutation } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import { saveTokenIntoSessionReturnExpiresAtFn } from "#src/auth/convex/crud/saveTokenIntoSessionReturnExpiresAtMutation.ts"
import type { DocUser, IdUser } from "#src/auth/convex/IdUser.ts"
import { docUserToUserProfile } from "#src/auth/convex/user/docUserToUserProfile.ts"
import type { UserSession } from "#src/auth/model/UserSession.ts"
import { loginMethod } from "#src/auth/model_field/loginMethod.ts"
import { createTokenResult } from "#src/auth/server/jwt_token/createTokenResult.ts"
import { orgGetQueryInternalFn } from "#src/org/org_convex/orgGetQuery.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authCredentialResolve } from "#src/utils/convex_backend/authCredentialResolve.ts"
import { stt } from "#src/utils/i18n/stt.ts"
import { nowIso } from "#utils/date/nowIso.js"

export type OrgInvitationAcceptValidatorType = typeof orgInvitationAcceptValidator.type

export const orgInvitationAcceptFields = valibotToConvex({
  token: a.string(),
  orgHandle: a.optional(a.string()),
  invitationCode: a.string(),
})

export const orgInvitationAcceptValidator = v.object(orgInvitationAcceptFields)

export const orgInvitation50AcceptMutation = mutation({
  args: orgInvitationAcceptValidator,
  handler: orgInvitation50AcceptFn,
})

export async function orgInvitation50AcceptFn(
  ctx: MutationCtx,
  args: OrgInvitationAcceptValidatorType,
): PromiseResult<UserSession> {
  const op = "orgInvitationAccept"

  const credentialResult = await authCredentialResolve(ctx, args.token)
  if (!credentialResult.success) {
    console.info(credentialResult)
    return credentialResult
  }
  const userId = credentialResult.data.userId

  // Find invitation
  const invitation = await ctx.db
    .query("orgInvitations")
    .withIndex("invitationCode", (q) => q.eq("invitationCode", args.invitationCode))
    .unique()

  if (!invitation) {
    return createResultError(op, "Invalid invitation code", args.invitationCode)
  }

  // Get org details for token
  const orgResult = await orgGetQueryInternalFn(ctx, {
    orgHandle: invitation.orgHandle,
  })
  if (!orgResult.success) {
    return orgResult
  }
  const org = orgResult.data
  if (!org) {
    return createResultError(op, "Organization not found")
  }
  if (org.deleting) {
    return createResultError(op, "Organization is currently being deleted")
  }

  // Find or create user
  const user = await ctx.db.get("users", userId)
  if (!user) {
    return createResultError(op, "User not found", userId)
  }

  // Check for email mismatch (case-insensitive, trim whitespace)
  if (user.email && user.email.toLowerCase().trim() !== invitation.invitedEmail.toLowerCase().trim()) {
    const errorMessage = stt(
      "Email mismatch, please use the same email as in the invitation (" + invitation.invitedEmail + ").",
    )
    return createResultError(op, errorMessage, userId)
  }

  const now = nowIso()

  // Update user if necessary
  const data: Partial<DocUser> = {
    emailVerifiedAt: now,
  }
  if (!user.email) {
    data.email = invitation.invitedEmail
  }
  await ctx.db.patch("users", userId, data)

  // Create session
  const tokenResult = await createTokenResult(userId, org.orgHandle, invitation.role)
  if (!tokenResult.success) {
    return tokenResult
  }
  const token = tokenResult.data
  const expiresAt = await saveTokenIntoSessionReturnExpiresAtFn(ctx, loginMethod.email, userId, token)

  // Create org member
  await ctx.db.insert("orgMembers", {
    orgId: org._id,
    orgHandle: org.orgHandle,
    userId: userId,
    role: invitation.role,
    invitedBy: invitation.invitedBy as IdUser,
    createdAt: now,
    updatedAt: now,
  })

  // Delete org invitation
  await ctx.db.delete("orgInvitations", invitation._id)

  // Create user profile
  const userProfile = docUserToUserProfile(user, org.orgHandle, invitation.role)

  // Create and return user session
  const userSession: UserSession = {
    token,
    profile: userProfile,
    hasPw: !!user.hashedPassword,
    signedInMethod: loginMethod.email,
    signedInAt: now,
    expiresAt,
  }

  return createResult(userSession)
}
