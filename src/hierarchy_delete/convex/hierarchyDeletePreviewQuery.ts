import * as a from "valibot"
import { query } from "#convex/_generated/server.js"
import { createResultError } from "#result"
import { hierarchyDeleteScopeDiscoverFn } from "#src/hierarchy_delete/convex/hierarchyDeleteScopeDiscoverFn.ts"
import { hierarchyDeleteTargetConvexFields } from "#src/hierarchy_delete/convex/hierarchyDeleteTargetConvexFields.ts"
import { hierarchyDeleteTargetSchema } from "#src/hierarchy_delete/model/hierarchyDeleteTargetSchema.ts"
import { authQueryResult } from "#src/utils/convex_backend/authQueryResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"

export const hierarchyDeletePreviewQuery = query({
  args: createTokenValidator(hierarchyDeleteTargetConvexFields),
  handler: (ctx, args) =>
    authQueryResult(ctx, args, async (ctx, data) => {
      const op = "hierarchyDeletePreviewQuery"
      const parsed = a.safeParse(hierarchyDeleteTargetSchema, {
        kind: data.kind,
        orgId: data.orgId,
        orgHandle: data.orgHandle,
        teamId: data.teamId,
        projectId: data.projectId,
        noteId: data.noteId,
      })
      if (!parsed.success) {
        return createResultError(op, "Invalid hierarchy delete target: " + JSON.stringify(parsed.issues))
      }
      return hierarchyDeleteScopeDiscoverFn(ctx, parsed.output, { limit: data.limit })
    }),
})
