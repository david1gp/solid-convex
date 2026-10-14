import { v } from "convex/values"
import { internalQuery, type QueryCtx } from "#convex/_generated/server.js"
import { createResult, type PromiseResult } from "#result"
import { userAdminCheckFn } from "#src/user_management/convex/userAdminCheckFn.ts"

export const userManagementAdminCheckInternalQuery = internalQuery({
  args: { token: v.string() },
  handler: async (ctx: QueryCtx, args): PromiseResult<{ readonly userId: string; readonly role: string }> => {
    const adminResult = await userAdminCheckFn(ctx, args.token)
    if (!adminResult.success) {
      return adminResult
    }
    return createResult({
      userId: adminResult.data._id,
      role: adminResult.data.role,
    })
  },
})
