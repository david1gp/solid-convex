import { v } from "convex/values"
import * as a from "valibot"
import { internalMutation, type MutationCtx, mutation } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import { assignmentCurrentGuardFn } from "#src/assignment/convex/assignmentCurrentGuardFn.ts"
import { fileGetByIdFn } from "#src/file/convex/fileGetByIdFn.ts"
import { resourceGetDocFn } from "#src/resource/convex/resourceGetQuery.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authMutationResult } from "#src/utils/convex_backend/authMutationResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"
import { nowIso } from "#utils/date/nowIso.js"

export type MeetingOrgAddMutationValidatorType = typeof resourceFileAddValidator.type

const resourceFileAddSchemaFields = {
  resourceId: a.string(),
  fileId: a.string(),
} as const
export const resourceFileAddFields = valibotToConvex(resourceFileAddSchemaFields)

export const resourceFileAddValidator = v.object(resourceFileAddFields)

export const resourceFileAddMutation = mutation({
  args: createTokenValidator(resourceFileAddFields),
  handler: async (ctx, args) => authMutationResult(ctx, args, resourceFileAddMutationFn),
})

export const resourceFileAddInternalMutation = internalMutation({
  args: resourceFileAddValidator,
  handler: resourceFileAddMutationFn,
})

export async function resourceFileAddMutationFn(
  ctx: MutationCtx,
  args: MeetingOrgAddMutationValidatorType,
): PromiseResult<null> {
  const op = "resourceFileAddMutationFn"
  const resource = await resourceGetDocFn(ctx, args.resourceId)
  if (!resource) {
    return createResultError(op, "Resource not found", args.resourceId)
  }
  const resourceGuard = await assignmentCurrentGuardFn(ctx, { kind: "resource", doc: resource })
  if (!resourceGuard.success) {
    return resourceGuard
  }

  const file = await fileGetByIdFn(ctx, args.fileId)
  if (file) {
    const fileGuard = await assignmentCurrentGuardFn(ctx, { kind: "file", doc: file })
    if (!fileGuard.success) {
      return fileGuard
    }
    if (file.resourceId && file.resourceId !== args.resourceId) {
      return createResultError(op, "File is already attached to a different resource")
    }
    if (!file.resourceId) {
      await ctx.db.patch("files", file._id, {
        resourceId: args.resourceId,
        updatedAt: nowIso(),
      })
    }
  }

  const existingFileLinks = await ctx.db
    .query("resourceFiles")
    .withIndex("fileId", (q) => q.eq("fileId", args.fileId))
    .collect()
  if (existingFileLinks.some((l) => l.resourceId !== args.resourceId)) {
    return createResultError(op, "File is already attached to a different resource")
  }

  const existingLink = existingFileLinks.find((l) => l.resourceId === args.resourceId)
  if (!existingLink) {
    await ctx.db.insert("resourceFiles", {
      resourceId: args.resourceId,
      fileId: args.fileId,
      createdAt: nowIso(),
    })
  }
  return createResult(null)
}
