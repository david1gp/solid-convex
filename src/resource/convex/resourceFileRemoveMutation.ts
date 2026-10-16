import { v } from "convex/values"
import * as a from "valibot"
import { internalMutation, type MutationCtx, mutation } from "#convex/_generated/server.js"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authMutationWrapResult } from "#src/utils/convex_backend/authMutationWrapResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"

export type MeetingOrgRemoveMutationValidatorType = typeof resourceFileRemoveValidator.type

const resourceFileRemoveSchemaFields = {
  resourceId: a.string(),
  fileId: a.string(),
} as const
export const resourceFileRemoveFields = valibotToConvex(resourceFileRemoveSchemaFields)

export const resourceFileRemoveValidator = v.object(resourceFileRemoveFields)

export const resourceFileRemoveMutation = mutation({
  args: createTokenValidator(resourceFileRemoveFields),
  handler: async (ctx, args) => authMutationWrapResult(ctx, args, resourceFileRemoveMutationFn),
})

export const resourceFileRemoveInternalMutation = internalMutation({
  args: resourceFileRemoveValidator,
  handler: resourceFileRemoveMutationFn,
})

export async function resourceFileRemoveMutationFn(
  ctx: MutationCtx,
  args: MeetingOrgRemoveMutationValidatorType,
): Promise<null> {
  const op = "resourceFileRemoveMutationFn"
  const list = await ctx.db
    .query("resourceFiles")
    .withIndex("resourceIdFileId", (q) => q.eq("resourceId", args.resourceId).eq("fileId", args.fileId))
    .collect()
  await Promise.all(list.map((e) => ctx.db.delete("resourceFiles", e._id)))
  return null
}
