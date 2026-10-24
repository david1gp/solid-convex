import { v } from "convex/values"
import * as a from "valibot"
import type { Id } from "#convex/_generated/dataModel.js"
import { internalMutation, type MutationCtx, mutation } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import { assignmentResolveFn } from "#src/assignment/convex/assignmentResolveFn.ts"
import { vAssignmentTarget } from "#src/assignment/convex/vAssignmentTarget.ts"
import { assignmentTargetSchema } from "#src/assignment/model/assignmentTargetSchema.ts"
import type { ResolvedAssignment } from "#src/assignment/model/resolvedAssignmentSchema.ts"
import type { IdResource } from "#src/resource/convex/IdResource.ts"
import { updateAssignedFileIds } from "#src/resource/convex/resourceEditMutation.ts"
import { resourceSearchProjection } from "#src/resource/convex/resourceSearchProjection.ts"
import { resourceDataSchemaFields } from "#src/resource/model/resourceSchema.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authMutationResult } from "#src/utils/convex_backend/authMutationResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"
import { stringSchemaId } from "#src/utils/valibot/stringSchema.ts"
import { nowIso } from "#utils/date/nowIso.js"

export type ResourceCreateValidatorType = typeof resourceCreateValidator.type

export const resourceCreateFields = {
  ...valibotToConvex(resourceDataSchemaFields),
  assignment: v.optional(v.union(vAssignmentTarget, v.null())),
  orgId: v.optional(v.union(v.string(), v.null())),
  teamId: v.optional(v.union(v.string(), v.null())),
  projectId: v.optional(v.union(v.string(), v.null())),
  noteId: v.optional(v.union(v.string(), v.null())),
  // Files
  ...valibotToConvex({ fileIds: a.optional(a.array(a.string())) }),
}

export const resourceCreateValidator = v.object(resourceCreateFields)

export const resourceCreateMutation = mutation({
  args: createTokenValidator(resourceCreateFields),
  handler: async (ctx, args) => authMutationResult(ctx, args, resourceCreateFn),
})

export const resourceCreateInternalMutation = internalMutation({
  args: resourceCreateValidator,
  handler: resourceCreateFn,
})

export async function resourceCreateFn(ctx: MutationCtx, args: ResourceCreateValidatorType): PromiseResult<IdResource> {
  const op = "resourceCreateFn"

  const schema = a.object({
    ...resourceDataSchemaFields,
    assignment: a.optional(a.nullable(assignmentTargetSchema)),
    orgId: a.optional(a.nullable(stringSchemaId)),
    teamId: a.optional(a.nullable(stringSchemaId)),
    projectId: a.optional(a.nullable(stringSchemaId)),
    noteId: a.optional(a.nullable(stringSchemaId)),
    // Files
    fileIds: a.optional(a.array(a.string())),
  })

  const parse = a.safeParse(schema, args)
  if (!parse.success) {
    return createResultError(op, a.summarize(parse.issues))
  }
  const { fileIds, assignment, orgId, teamId, projectId, noteId, ...rest } = parse.output

  const existingResource = await ctx.db
    .query("resources")
    .withIndex("resourceId", (q) => q.eq("resourceId", rest.resourceId))
    .first()
  if (existingResource) {
    return createResultError(op, "Resource already exists", rest.resourceId)
  }

  const hasExplicitAssignment =
    assignment !== undefined ||
    orgId !== undefined ||
    teamId !== undefined ||
    projectId !== undefined ||
    noteId !== undefined

  let assignmentDoc: ResolvedAssignment
  if (hasExplicitAssignment) {
    if (assignment === null) {
      assignmentDoc = {
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
      assignmentDoc = res.data
    }
  } else {
    assignmentDoc = {
      assignment: undefined,
      orgId: undefined,
      teamId: undefined,
      projectId: undefined,
      noteId: undefined,
    }
  }

  const now = nowIso()
  const searchProjection = resourceSearchProjection(rest)
  const id = await ctx.db.insert("resources", {
    ...rest,
    assignment: assignmentDoc.assignment,
    orgId: assignmentDoc.orgId,
    teamId: assignmentDoc.teamId,
    projectId: assignmentDoc.projectId,
    noteId: assignmentDoc.noteId,
    ...searchProjection,
    createdAt: now,
    updatedAt: now,
  })

  if (assignmentDoc.orgId) {
    const org = await ctx.db.get("orgs", assignmentDoc.orgId as Id<"orgs">)
    if (org) {
      await ctx.db.insert("orgResources", {
        orgId: org._id,
        orgHandle: org.orgHandle,
        resourceId: rest.resourceId,
        ...searchProjection,
        createdAt: now,
      })
    }
  }

  // Associate files if provided
  if (fileIds && fileIds.length > 0) {
    await updateAssignedFileIds(ctx, rest.resourceId, fileIds)
  }

  console.info(op, { resourceId: rest.resourceId })
  return createResult(id)
}
