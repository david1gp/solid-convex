import { internalQuery, type QueryCtx } from "#convex/_generated/server.js"
import type { DocUser } from "#src/auth/convex/IdUser.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { emailSchema } from "#src/utils/valibot/emailSchema.ts"

export const findUserByEmailInternalQuery = internalQuery({
  args: valibotToConvex({ email: emailSchema }),
  handler: async (ctx: QueryCtx, args) => userEmailFindFn(ctx, args.email),
})

export async function userEmailFindFn(ctx: QueryCtx, email: string): Promise<DocUser | null> {
  return await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", email))
    .unique()
}
