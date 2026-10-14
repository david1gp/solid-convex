import { v } from "convex/values"
import * as a from "valibot"
import type { Doc, Id } from "#convex/_generated/dataModel.js"
import { internalMutation, type MutationCtx, mutation } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import { assignmentCurrentGuardFn } from "#src/assignment/convex/assignmentCurrentGuardFn.ts"
import { assignmentResolveFn } from "#src/assignment/convex/assignmentResolveFn.ts"
import { vAssignmentTarget } from "#src/assignment/convex/vAssignmentTarget.ts"
import { assignmentTargetSchema } from "#src/assignment/model/assignmentTargetSchema.ts"
import type { ResolvedAssignment } from "#src/assignment/model/resolvedAssignmentSchema.ts"
import { vIdUser } from "#src/auth/convex/vIdUser.ts"
import type { IdFile } from "#src/file/convex/IdFile.ts"
import { fileDataUnuploadedSchemaFields } from "#src/file/model/FileDataUnuploaded.ts"
import { fileDataUploadedSchemaFields } from "#src/file/model/FileDataUploaded.ts"
import { fileSchemaFields } from "#src/file/model/fileSchema.ts"
import { resourceIdSchema } from "#src/resource/model/resourceIdSchema.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authMutationTokenToUserId } from "#src/utils/convex_backend/authMutationTokenToUserId.ts"
import { createErrorAndLogError } from "#src/utils/convex_backend/createErrorAndLogError.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"
import { stringSchemaId } from "#src/utils/valibot/stringSchema.ts"
import { nowIso } from "#utils/date/nowIso.js"

const fileMetaDataSchemaFields = {
  fileId: stringSchemaId,
  username: a.optional(stringSchemaId),
} as const

const fileTableDataSchemaFields = {
  ...fileMetaDataSchemaFields,
  ...fileSchemaFields,
} as const

export const fileCreateFields = {
  userId: v.optional(vIdUser),
  ...valibotToConvex(fileTableDataSchemaFields),
  assignment: v.optional(v.union(vAssignmentTarget, v.null())),
  orgId: v.optional(v.union(v.string(), v.null())),
  teamId: v.optional(v.union(v.string(), v.null())),
  projectId: v.optional(v.union(v.string(), v.null())),
  noteId: v.optional(v.union(v.string(), v.null())),
  resourceId: v.optional(v.union(v.string(), v.null())),
}
export const fileCreateValidator = v.object({
  ...fileCreateFields,
  userId: vIdUser,
})
export type FileCreateValidatorType = typeof fileCreateValidator.type

export const fileCreateMutation = mutation({
  args: createTokenValidator(fileCreateFields),
  handler: async (ctx, args) =>
    authMutationTokenToUserId(ctx, args, async (ctx, authedArgs) => {
      const { token: _token, ...rest } = authedArgs as any
      return fileCreateFn(ctx, rest)
    }),
})

export const fileCreateInternalMutation = internalMutation({
  args: fileCreateValidator,
  handler: fileCreateFn,
})

export async function fileCreateFn(ctx: MutationCtx, args: FileCreateValidatorType): PromiseResult<IdFile> {
  const op = "fileCreateFn"

  const schema = a.object({
    userId: stringSchemaId,
    ...fileTableDataSchemaFields,
    assignment: a.optional(a.nullable(assignmentTargetSchema)),
    orgId: a.optional(a.nullable(stringSchemaId)),
    teamId: a.optional(a.nullable(stringSchemaId)),
    projectId: a.optional(a.nullable(stringSchemaId)),
    noteId: a.optional(a.nullable(stringSchemaId)),
    resourceId: a.optional(a.nullable(resourceIdSchema)),
  })

  const parse = a.safeParse(schema, args)
  if (!parse.success) {
    return createErrorAndLogError(op, a.summarize(parse.issues))
  }

  const { assignment, orgId, teamId, projectId, noteId, resourceId, ...rest } = parse.output

  let targetResource: Doc<"resources"> | null = null
  if (resourceId) {
    targetResource = await ctx.db
      .query("resources")
      .withIndex("resourceId", (q) => q.eq("resourceId", resourceId))
      .first()
    if (!targetResource) {
      return createResultError(op, "Resource not found", resourceId)
    }
    const resourceGuard = await assignmentCurrentGuardFn(ctx, { kind: "resource", doc: targetResource })
    if (!resourceGuard.success) {
      return resourceGuard
    }
  }

  const hasExplicitAssignment =
    assignment !== undefined ||
    orgId !== undefined ||
    teamId !== undefined ||
    projectId !== undefined ||
    noteId !== undefined

  let resolvedAssignment: ResolvedAssignment

  if (hasExplicitAssignment) {
    if (assignment === null) {
      resolvedAssignment = {
        assignment: undefined,
        orgId: undefined,
        teamId: undefined,
        projectId: undefined,
        noteId: undefined,
      }
    } else {
      const res = await assignmentResolveFn(ctx, {
        assignment: assignment ?? undefined,
        orgId: (orgId ?? undefined) as Id<"orgs"> | undefined,
        teamId: (teamId ?? undefined) as Id<"teams"> | undefined,
        projectId: (projectId ?? undefined) as Id<"projects"> | undefined,
        noteId: (noteId ?? undefined) as Id<"notes"> | undefined,
      })
      if (!res.success) return res
      resolvedAssignment = res.data
    }
  } else if (resourceId && targetResource) {
    // Inherit assignment from resource if not explicitly provided
    resolvedAssignment = {
      assignment: targetResource.assignment,
      orgId: targetResource.orgId,
      teamId: targetResource.teamId,
      projectId: targetResource.projectId,
      noteId: targetResource.noteId,
    }
  } else {
    resolvedAssignment = {
      assignment: undefined,
      orgId: undefined,
      teamId: undefined,
      projectId: undefined,
      noteId: undefined,
    }
  }

  const existingFile = await ctx.db
    .query("files")
    .withIndex("fileId", (q) => q.eq("fileId", rest.fileId))
    .first()

  if (existingFile) {
    if (existingFile.userId !== args.userId) {
      return createResultError(op, "File ownership conflict", rest.fileId)
    }

    const fileGuard = await assignmentCurrentGuardFn(ctx, { kind: "file", doc: existingFile })
    if (!fileGuard.success) {
      return fileGuard
    }

    if (
      existingFile.url !== rest.url ||
      existingFile.displayName !== rest.displayName ||
      existingFile.fileSize !== rest.fileSize ||
      existingFile.contentType !== rest.contentType ||
      (existingFile.imageWidth ?? undefined) !== (rest.imageWidth ?? undefined) ||
      (existingFile.imageHeight ?? undefined) !== (rest.imageHeight ?? undefined) ||
      (existingFile.language ?? undefined) !== (rest.language ?? undefined) ||
      (existingFile.username !== undefined && rest.username !== undefined && existingFile.username !== rest.username)
    ) {
      return createResultError(op, "File metadata conflict", rest.fileId)
    }

    const existingAssignmentKind = existingFile.assignment?.kind
    const existingAssignmentId = existingFile.assignment?.id
    const newAssignmentKind = resolvedAssignment.assignment?.kind
    const newAssignmentId = resolvedAssignment.assignment?.id

    if (
      (existingFile.resourceId ?? undefined) !== (resourceId ?? undefined) ||
      (existingFile.orgId ?? undefined) !== (resolvedAssignment.orgId ?? undefined) ||
      (existingFile.teamId ?? undefined) !== (resolvedAssignment.teamId ?? undefined) ||
      (existingFile.projectId ?? undefined) !== (resolvedAssignment.projectId ?? undefined) ||
      (existingFile.noteId ?? undefined) !== (resolvedAssignment.noteId ?? undefined) ||
      existingAssignmentKind !== newAssignmentKind ||
      existingAssignmentId !== newAssignmentId
    ) {
      return createResultError(op, "File assignment conflict", rest.fileId)
    }

    if (resourceId) {
      const existingLink = await ctx.db
        .query("resourceFiles")
        .withIndex("resourceIdFileId", (q) => q.eq("resourceId", resourceId).eq("fileId", rest.fileId))
        .first()
      if (!existingLink) {
        await ctx.db.insert("resourceFiles", {
          resourceId,
          fileId: rest.fileId,
          createdAt: nowIso(),
        })
      }
    }

    return createResult(existingFile._id)
  }

  const now = nowIso()

  // Ensure resourceFiles and files.resourceId membership persists
  if (resourceId) {
    const existingLink = await ctx.db
      .query("resourceFiles")
      .withIndex("resourceIdFileId", (q) => q.eq("resourceId", resourceId).eq("fileId", rest.fileId))
      .first()
    if (!existingLink) {
      await ctx.db.insert("resourceFiles", {
        resourceId,
        fileId: rest.fileId,
        createdAt: now,
      })
    }
  }

  const id = await ctx.db.insert("files", {
    ...rest,
    userId: args.userId,
    resourceId: resourceId ?? undefined,
    assignment: resolvedAssignment.assignment,
    orgId: resolvedAssignment.orgId,
    teamId: resolvedAssignment.teamId,
    projectId: resolvedAssignment.projectId,
    noteId: resolvedAssignment.noteId,
    createdAt: now,
    updatedAt: now,
  })
  return createResult(id)
}
