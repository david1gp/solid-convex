import { v } from "convex/values"
import { query } from "#convex/_generated/server.js"
import { noteContextFields } from "#src/note/convex/noteContextFields.ts"
import { noteGetFn } from "#src/note/convex/noteGetFn.ts"
import { authQueryResult } from "#src/utils/convex_backend/authQueryResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"

export const noteGetQuery = query({
  args: createTokenValidator({
    ...noteContextFields,
    noteId: v.string(),
    projectId: v.optional(v.string()),
    teamId: v.optional(v.string()),
  }),
  handler: (ctx, args) => authQueryResult(ctx, args, (ctx, data) => noteGetFn(ctx, data)),
})
