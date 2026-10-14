import { v } from "convex/values"
import { query } from "#convex/_generated/server.js"
import { teamGetFn } from "#src/team/convex/teamGetFn.ts"
import { teamOrgContextFields } from "#src/team/convex/teamOrgContextFields.ts"
import { authQueryResult } from "#src/utils/convex_backend/authQueryResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"

export const teamGetQuery = query({
  args: createTokenValidator({ teamId: v.string(), ...teamOrgContextFields }),
  handler: (ctx, args) => authQueryResult(ctx, args, teamGetFn),
})
