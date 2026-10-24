import { internalMutation, type MutationCtx } from "#convex/_generated/server.js"
import { week1timeMs } from "#src/auth/convex/otp/week1timeMs.ts"

export const signUpConfirmEmail3CleanupOldCodesInternalMutation = internalMutation({
  args: {},
  handler: signUpConfirmEmail3CleanupOldCodesInternalMutationFn,
})

export async function signUpConfirmEmail3CleanupOldCodesInternalMutationFn(
  ctx: MutationCtx,
): Promise<{ deleted: number }> {
  const oneDayAgo = new Date(Date.now() - week1timeMs).toISOString()

  let deletedCount = 0
  while (true) {
    const oldCodes = await ctx.db
      .query("authUserEmailRegistrations")
      .withIndex("createdAt", (q) => q.lt("createdAt", oneDayAgo))
      .take(500)
    if (oldCodes.length === 0) break
    for (const code of oldCodes) {
      await ctx.db.delete("authUserEmailRegistrations", code._id)
      deletedCount++
    }
  }

  return { deleted: deletedCount }
}
