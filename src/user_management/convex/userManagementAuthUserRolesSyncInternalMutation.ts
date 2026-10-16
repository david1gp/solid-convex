import { v } from "convex/values"
import { internalMutation } from "#convex/_generated/server.js"
import type { PromiseResult } from "#result"
import { createResult, createResultError } from "#result"
import type { UserRole } from "#src/auth/model_field/userRole.ts"
import { userRoleEffectiveGet } from "#src/auth/model_field/userRoleEffectiveGet.ts"

interface UserManagementAuthUserRolesSyncResult {
  readonly updated: boolean
  readonly userId?: string
  readonly roles?: readonly UserRole[]
  readonly role?: UserRole
  readonly reason?: string
}

export const userManagementAuthUserRolesSyncInternalMutation = internalMutation({
  args: {
    providerSubject: v.string(),
    roles: v.array(v.string()),
  },
  handler: async (ctx, args): PromiseResult<UserManagementAuthUserRolesSyncResult> => {
    const op = "userManagementAuthUserRolesSyncInternalMutation"
    const account = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) => q.eq("provider", "oidc").eq("providerAccountId", args.providerSubject))
      .first()

    if (!account) {
      return createResult({
        updated: false,
        reason: "No local auth account linked yet for provider subject",
      })
    }

    const user = await ctx.db.get("users", account.userId)
    if (!user) {
      return createResultError(op, "Linked local auth user not found", account.userId)
    }

    const roles = args.roles as readonly UserRole[]
    const role = userRoleEffectiveGet(roles)
    const updatedAt = new Date().toISOString()

    await ctx.db.patch("users", user._id, {
      roles: [...roles],
      role,
      updatedAt,
    })

    return createResult({
      updated: true,
      userId: user._id,
      roles: [...roles],
      role,
    })
  },
})
