import { internalMutation, type MutationCtx } from "#convex/_generated/server.js"
import { otpCleanupOldFn } from "#src/auth/convex/otp/otpsCleanupOldMutation.ts"
import { week1timeMs } from "#src/auth/convex/otp/week1timeMs.ts"

export const signInViaEmailEnterOtp3CleanupOldCodesInternalMutation = internalMutation({
  args: {},
  handler: signInViaEmailEnterOtp3CleanupOldCodesFn,
})

export async function signInViaEmailEnterOtp3CleanupOldCodesFn(ctx: MutationCtx): Promise<{ deleted: number }> {
  const week1Ago = new Date(Date.now() - week1timeMs).toISOString()

  let deletedCount = 0
  while (true) {
    const oldCodes = await ctx.db
      .query("authEmailLoginCodes")
      .withIndex("createdAt", (q) => q.lt("createdAt", week1Ago))
      .take(500)
    if (oldCodes.length === 0) break
    for (const code of oldCodes) {
      await ctx.db.delete("authEmailLoginCodes", code._id)
      deletedCount++
    }
  }
  const otpDelted = await otpCleanupOldFn(ctx)

  return { deleted: deletedCount + otpDelted.deleted }
}
