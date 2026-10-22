import { internalMutation } from "#convex/_generated/server.js"
import type { PromiseResult } from "#result"
import { otpCodeGenerate } from "#src/auth/convex/pw/otpCodeGenerate.ts"
import { vIdUser } from "#src/auth/convex/vIdUser.ts"
import { otpPurposeValidator } from "#src/auth/model_field/otpPurpose.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { emailSchema } from "#src/utils/valibot/emailSchema.ts"
import { nowIso } from "#utils/date/nowIso.js"

const otpSaveFields = valibotToConvex({
  email: emailSchema,
})

export const otpSaveInternalMutation = internalMutation({
  args: {
    userId: vIdUser,
    ...otpSaveFields,
    purpose: otpPurposeValidator,
  },
  handler: async (ctx, args): PromiseResult<string> => {
    const code = otpCodeGenerate()

    await ctx.db.insert("authOtps", {
      userId: args.userId,
      name: "",
      email: args.email,
      code,
      purpose: args.purpose,
      createdAt: nowIso(),
      consumedAt: undefined,
    })

    return { success: true, data: code }
  },
})
