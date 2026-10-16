import { type QueryCtx, query } from "#convex/_generated/server.js"
import type { DocUser } from "#src/auth/convex/IdUser.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { handleSchema } from "#src/utils/valibot/handleSchema.ts"

export const userGetByUsernameQuery = query({
  args: valibotToConvex({ username: handleSchema }),
  handler: async (ctx: QueryCtx, args) => userGetByNicknameQueryFn(ctx, args.username),
})

export async function userGetByNicknameQueryFn(ctx: QueryCtx, username: string): Promise<DocUser | null> {
  return await ctx.db
    .query("users")
    .withIndex("username", (q) => q.eq("username", username))
    .unique()
}
