import type { MutationCtx } from "#convex/_generated/server.js"
import type { PromiseResult } from "#result"
import type { IdUser } from "#src/auth/convex/IdUser.ts"
import { otpCodeGenerate } from "#src/auth/convex/pw/otpCodeGenerate.ts"
import type { OtpPurpose } from "#src/auth/model_field/otpPurpose.ts"
import { nowIso } from "#utils/date/nowIso.js"

export async function otpSaveFn(
  ctx: MutationCtx,
  args: { userId: IdUser; email: string; purpose: OtpPurpose },
): PromiseResult<string> {
  const op = "otpCodeSaveFn"
  const { userId, email, purpose } = args

  // await otpRemovePreviousFn(ctx, { userId, email, purpose })

  const code = otpCodeGenerate()

  await ctx.db.insert("authOtps", {
    userId,
    name: "",
    email,
    code,
    purpose,
    createdAt: nowIso(),
    consumedAt: undefined,
  })

  return { success: true, data: code }
}
