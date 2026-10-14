import { v } from "convex/values"
import * as a from "valibot"
import type { Id } from "#convex/_generated/dataModel.js"
import { internalMutation, type MutationCtx, mutation } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import { languageOrNoneSchema } from "#src/app/i18n/language.ts"
import { assignmentCurrentGuardFn } from "#src/assignment/convex/assignmentCurrentGuardFn.ts"
import { assignmentResolveFn } from "#src/assignment/convex/assignmentResolveFn.ts"
import { vAssignmentTarget } from "#src/assignment/convex/vAssignmentTarget.ts"
import { assignmentTargetSchema } from "#src/assignment/model/assignmentTargetSchema.ts"
import { fileGetByIdFn } from "#src/file/convex/fileGetByIdFn.ts"
import type { DocFile } from "#src/file/convex/IdFile.ts"
import { resourceIdSchema } from "#src/resource/model/resourceIdSchema.ts"
import { authMutationResult } from "#src/utils/convex_backend/authMutationResult.ts"
import { createErrorAndLogWarn } from "#src/utils/convex_backend/createErrorAndLogWarn.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { stringSchemaId } from "#src/utils/valibot/stringSchema.ts"
import { nowIso } from "#utils/date/nowIso.js"

const fileEditSchemaFields = {
  fileId: a.string(),
  // data
  displayName: a.optional(a.string()),
  language: a.optional(languageOrNoneSchema),
} as const

export const fileEditFields = {
  ...valibotToConvex(fileEditSchemaFields),
  resourceId: v.optional(v.union(v.string(), v.null())),
  assignment: v.optional(v.union(vAssignmentTarget, v.null())),
  orgId: v.optional(v.union(v.string(), v.null())),
  teamId: v.optional(v.union(v.string(), v.null())),
  projectId: v.optional(v.union(v.string(), v.null())),
  noteId: v.optional(v.union(v.string(), v.null())),
}

export const fileEditValidator = v.object(fileEditFields)
export type FileEditValidatorType = typeof fileEditValidator.type

export const fileEditMutation = mutation({
  args: createTokenValidator(fileEditFields),
  handler: async (ctx, args) => authMutationResult(ctx, args, fileEditFn),
})

export const fileEditInternalMutation = internalMutation({
  args: fileEditValidator,
  handler: fileEditFn,
})

export async function fileEditFn(ctx: MutationCtx, args: FileEditValidatorType): PromiseResult<null> {
  const op = "fileEditFn"

  const file = await fileGetByIdFn(ctx, args.fileId)
  if (!file) {
    return createErrorAndLogWarn(op, "File not found", args.fileId)
  }
  if (file.deletedAt) {
    return createErrorAndLogWarn(op, "File is being deleted", args.fileId)
  }

  const guard = await assignmentCurrentGuardFn(ctx, { kind: "file", doc: file })
  if (!guard.success) {
    return guard
  }

  const schema = a.object({
    fileId: a.string(),
    displayName: a.optional(a.string()),
    language: a.optional(languageOrNoneSchema),
    resourceId: a.optional(a.nullable(resourceIdSchema)),
    assignment: a.optional(a.nullable(assignmentTargetSchema)),
    orgId: a.optional(a.nullable(stringSchemaId)),
    teamId: a.optional(a.nullable(stringSchemaId)),
    projectId: a.optional(a.nullable(stringSchemaId)),
    noteId: a.optional(a.nullable(stringSchemaId)),
  })

  const parse = a.safeParse(schema, args)
  if (!parse.success) {
    return createErrorAndLogWarn(op, a.summarize(parse.issues))
  }

  const { fileId, displayName, language, resourceId, assignment, orgId, teamId, projectId, noteId } = parse.output
  const patch: Partial<DocFile> = {}

  if (displayName !== undefined) {
    patch.displayName = displayName
  }
  if (language !== undefined) {
    patch.language = language
  }

  const hasExplicitAssignment =
    assignment !== undefined ||
    orgId !== undefined ||
    teamId !== undefined ||
    projectId !== undefined ||
    noteId !== undefined

  if (hasExplicitAssignment) {
    if (assignment === null) {
      patch.assignment = undefined
      patch.orgId = undefined
      patch.teamId = undefined
      patch.projectId = undefined
      patch.noteId = undefined
    } else {
      const res = await assignmentResolveFn(ctx, {
        assignment: assignment ?? undefined,
        orgId: (orgId ?? undefined) as Id<"orgs"> | undefined,
        teamId: (teamId ?? undefined) as Id<"teams"> | undefined,
        projectId: (projectId ?? undefined) as Id<"projects"> | undefined,
        noteId: (noteId ?? undefined) as Id<"notes"> | undefined,
      })
      if (!res.success) return res
      patch.assignment = res.data.assignment
      patch.orgId = res.data.orgId
      patch.teamId = res.data.teamId
      patch.projectId = res.data.projectId
      patch.noteId = res.data.noteId
    }
  }

  if (resourceId !== undefined) {
    if (resourceId === null) {
      if (file.resourceId) {
        const oldLink = await ctx.db
          .query("resourceFiles")
          .withIndex("resourceIdFileId", (q) => q.eq("resourceId", file.resourceId!).eq("fileId", file.fileId))
          .first()
        if (oldLink) await ctx.db.delete("resourceFiles", oldLink._id)
      }
      patch.resourceId = undefined
    } else {
      const resource = await ctx.db
        .query("resources")
        .withIndex("resourceId", (q) => q.eq("resourceId", resourceId))
        .first()
      if (!resource) {
        return createResultError(op, "Resource not found", resourceId)
      }
      const resourceGuard = await assignmentCurrentGuardFn(ctx, { kind: "resource", doc: resource })
      if (!resourceGuard.success) {
        return resourceGuard
      }
      if (file.resourceId && file.resourceId !== resourceId) {
        const oldLink = await ctx.db
          .query("resourceFiles")
          .withIndex("resourceIdFileId", (q) => q.eq("resourceId", file.resourceId!).eq("fileId", file.fileId))
          .first()
        if (oldLink) await ctx.db.delete("resourceFiles", oldLink._id)
      }
      const existingLink = await ctx.db
        .query("resourceFiles")
        .withIndex("resourceIdFileId", (q) => q.eq("resourceId", resourceId).eq("fileId", file.fileId))
        .first()
      if (!existingLink) {
        await ctx.db.insert("resourceFiles", {
          resourceId,
          fileId: file.fileId,
          createdAt: nowIso(),
        })
      }
      patch.resourceId = resourceId
    }
  }

  patch.updatedAt = nowIso()
  await ctx.db.patch("files", file._id, patch)
  return createResult(null)
}
