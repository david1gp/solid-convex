import { v } from "convex/values"
import { query } from "#convex/_generated/server.js"
import { projectContextFields } from "#src/project/convex/projectContextFields.ts"
import { projectGetFn } from "#src/project/convex/projectGetFn.ts"
import { authQueryResult } from "#src/utils/convex_backend/authQueryResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"

export const projectGetQuery = query({
  args: createTokenValidator({
    ...projectContextFields,
    projectId: v.string(),
    teamId: v.optional(v.string()),
  }),
  handler: (ctx, args) => authQueryResult(ctx, args, projectGetFn),
})
