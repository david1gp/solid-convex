import { v } from "convex/values"
import * as a from "valibot"
import { type MutationCtx, mutation } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authMutationResult } from "#src/utils/convex_backend/authMutationResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"

export type OrgInvitationDismissValidatorType = typeof orgInvitationDismissValidator.type

export const orgInvitationDismissFields = valibotToConvex({ invitationCode: a.string() })

export const orgInvitationDismissValidator = v.object(orgInvitationDismissFields)

export const orgInvitation60DismissMutation = mutation({
  args: createTokenValidator(orgInvitationDismissFields),
  handler: async (ctx, args) => authMutationResult(ctx, args, orgInvitation60DismissMutationFn),
})

export async function orgInvitation60DismissMutationFn(
  ctx: MutationCtx,
  args: OrgInvitationDismissValidatorType,
): PromiseResult<null> {
  const op = "orgInvitationDismissFn"

  const invitation = await ctx.db
    .query("orgInvitations")
    .withIndex("invitationCode", (q) => q.eq("invitationCode", args.invitationCode))
    .unique()
  if (!invitation) {
    return createResultError(op, "Invitation not found", args.invitationCode)
  }

  await ctx.db.delete("orgInvitations", invitation._id)

  return createResult(null)
}
