import { v } from "convex/values"
import * as a from "valibot"
import { internal } from "#convex/_generated/api.js"
import type { Id } from "#convex/_generated/dataModel.js"
import { internalMutation, type MutationCtx, mutation } from "#convex/_generated/server.js"
import { createResult, createResultError, type PromiseResult } from "#result"
import { assignmentCurrentGuardFn } from "#src/assignment/convex/assignmentCurrentGuardFn.ts"
import { assignmentResolveFn } from "#src/assignment/convex/assignmentResolveFn.ts"
import { vAssignmentTarget } from "#src/assignment/convex/vAssignmentTarget.ts"
import { assignmentTargetSchema } from "#src/assignment/model/assignmentTargetSchema.ts"
import type { DocResource } from "#src/resource/convex/IdResource.ts"
import { resourceSearchProjection } from "#src/resource/convex/resourceSearchProjection.ts"
import { resourceDataSchemaFields } from "#src/resource/model/resourceSchema.ts"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { authMutationResult } from "#src/utils/convex_backend/authMutationResult.ts"
import { createTokenValidator } from "#src/utils/convex_backend/createTokenValidator.ts"
import { paginationDefaultOptions } from "#src/utils/convex_backend/paginationDefaultOptions.ts"
import { paginationOptsValidator } from "#src/utils/convex_backend/paginationOptsValidator.ts"
import { stringSchemaId } from "#src/utils/valibot/stringSchema.ts"
import { nowIso } from "#utils/date/nowIso.js"

export const resourceEditFields = {
  ...valibotToConvex(resourceDataSchemaFields),
  assignment: v.optional(v.union(vAssignmentTarget, v.null())),
  orgId: v.optional(v.union(v.string(), v.null())),
  teamId: v.optional(v.union(v.string(), v.null())),
  projectId: v.optional(v.union(v.string(), v.null())),
  noteId: v.optional(v.union(v.string(), v.null())),
  // Files
  ...valibotToConvex({ fileIds: a.optional(a.array(a.string())) }),
}
export const resourceEditValidator = v.object(resourceEditFields)
export type ResourceEditValidatorType = typeof resourceEditValidator.type

export const resourceEditMutation = mutation({
  args: createTokenValidator(resourceEditFields),
  handler: async (ctx, args) => authMutationResult(ctx, args, resourceEditFn),
})

export const resourceEditInternalMutation = internalMutation({
  args: resourceEditValidator,
  handler: resourceEditFn,
})

const resourceEditOrgResourceProjectionsFields = {
  ...valibotToConvex({ resourceId: a.string() }),
  paginationOpts: paginationOptsValidator,
} as const

const resourceEditOrgResourceProjectionsValidator = v.object(resourceEditOrgResourceProjectionsFields)

export const resourceEditOrgResourceProjectionsInternalMutation = internalMutation({
  args: resourceEditOrgResourceProjectionsValidator,
  handler: resourceEditOrgResourceProjectionsFn,
})

export async function resourceEditFn(ctx: MutationCtx, args: ResourceEditValidatorType): PromiseResult<null> {
  const op = "resourceEditFn"

  const schema = a.object({
    ...resourceDataSchemaFields,
    assignment: a.optional(a.nullable(assignmentTargetSchema)),
    orgId: a.optional(a.nullable(stringSchemaId)),
    teamId: a.optional(a.nullable(stringSchemaId)),
    projectId: a.optional(a.nullable(stringSchemaId)),
    noteId: a.optional(a.nullable(stringSchemaId)),
    fileIds: a.optional(a.array(a.string())),
  })

  const parse = a.safeParse(schema, args)
  if (!parse.success) {
    return createResultError(op, a.summarize(parse.issues))
  }
  const { resourceId, fileIds, assignment, orgId, teamId, projectId, noteId, ...rest } = parse.output

  const resource = await ctx.db
    .query("resources")
    .withIndex("resourceId", (q) => q.eq("resourceId", resourceId))
    .unique()
  if (!resource) {
    return createResultError(op, "Resource not found", resourceId)
  }
  if (resource.deletedAt) {
    return createResultError(op, "Resource is being deleted", resourceId)
  }

  const guard = await assignmentCurrentGuardFn(ctx, { kind: "resource", doc: resource })
  if (!guard.success) {
    return guard
  }

  // Update file assignments if provided
  if (fileIds !== undefined) {
    const updateResult = await updateAssignedFileIds(ctx, resourceId, fileIds)
    if (!updateResult.success) {
      return updateResult
    }
  }

  const hasExplicitAssignment =
    assignment !== undefined ||
    orgId !== undefined ||
    teamId !== undefined ||
    projectId !== undefined ||
    noteId !== undefined

  let assignmentPatch: Partial<DocResource> = {}
  let orgSyncNeeded = false
  let syncOrgId: Id<"orgs"> | undefined

  if (hasExplicitAssignment) {
    orgSyncNeeded = true
    if (assignment === null) {
      assignmentPatch = {
        assignment: undefined,
        orgId: undefined,
        teamId: undefined,
        projectId: undefined,
        noteId: undefined,
      }
      syncOrgId = undefined
    } else {
      const res = await assignmentResolveFn(ctx, {
        assignment: assignment ?? undefined,
        orgId: (orgId ?? undefined) as Id<"orgs"> | undefined,
        teamId: (teamId ?? undefined) as Id<"teams"> | undefined,
        projectId: (projectId ?? undefined) as Id<"projects"> | undefined,
        noteId: (noteId ?? undefined) as Id<"notes"> | undefined,
      })
      if (!res.success) return res
      assignmentPatch = {
        assignment: res.data.assignment,
        orgId: res.data.orgId,
        teamId: res.data.teamId,
        projectId: res.data.projectId,
        noteId: res.data.noteId,
      }
      syncOrgId = res.data.orgId as Id<"orgs"> | undefined
    }
  }

  const patch: Partial<DocResource> = {
    ...rest,
    ...assignmentPatch,
  }
  const searchProjection = resourceSearchProjection({ ...resource, ...rest, ...assignmentPatch })
  Object.assign(patch, searchProjection)
  patch.updatedAt = nowIso()

  await ctx.db.patch("resources", resource._id, patch)
  console.info(op, { resourceId })

  if (orgSyncNeeded) {
    await resourceOrgResourcesSync(ctx, resource.resourceId, syncOrgId, searchProjection)
  } else {
    await ctx.scheduler.runAfter(0, internal.resource.resourceEditOrgResourceProjectionsInternalMutation, {
      resourceId: resource.resourceId,
      paginationOpts: paginationDefaultOptions,
    })
  }

  return createResult(null)
}

async function resourceOrgResourcesSync(
  ctx: MutationCtx,
  resourceId: string,
  targetOrgId: Id<"orgs"> | undefined,
  searchProjection: Record<string, unknown>,
): Promise<void> {
  const existingOrgResources = await ctx.db
    .query("orgResources")
    .withIndex("resourceId", (q) => q.eq("resourceId", resourceId))
    .collect()

  if (!targetOrgId) {
    for (const orgRes of existingOrgResources) {
      await ctx.db.delete("orgResources", orgRes._id)
    }
    return
  }

  // Remove conflicting orgResources for other orgs
  for (const orgRes of existingOrgResources) {
    if (orgRes.orgId !== targetOrgId) {
      await ctx.db.delete("orgResources", orgRes._id)
    }
  }

  // Ensure matching org resource exists
  const matching = existingOrgResources.find((e) => e.orgId === targetOrgId)
  if (!matching) {
    const org = await ctx.db.get("orgs", targetOrgId)
    if (org) {
      await ctx.db.insert("orgResources", {
        orgId: org._id,
        orgHandle: org.orgHandle,
        resourceId,
        ...searchProjection,
        createdAt: nowIso(),
      })
    }
  } else {
    await ctx.db.patch("orgResources", matching._id, searchProjection)
  }
}

async function resourceEditOrgResourceProjectionsFn(
  ctx: MutationCtx,
  args: typeof resourceEditOrgResourceProjectionsValidator.type,
): Promise<null> {
  const paginationOpts = args.paginationOpts ?? paginationDefaultOptions
  const resource = await ctx.db
    .query("resources")
    .withIndex("resourceId", (q) => q.eq("resourceId", args.resourceId))
    .unique()

  if (!resource) {
    await ctx.scheduler.runAfter(0, internal.resource.resourceOrgResourcesDeleteInternalMutation, {
      resourceId: args.resourceId,
      paginationOpts,
    })
    return null
  }

  const searchProjection = resourceSearchProjection(resource)
  const result = await ctx.db
    .query("orgResources")
    .withIndex("resourceId", (q) => q.eq("resourceId", args.resourceId))
    .paginate(paginationOpts)

  await Promise.all(result.page.map((orgResource) => ctx.db.patch("orgResources", orgResource._id, searchProjection)))

  if (!result.isDone) {
    await ctx.scheduler.runAfter(0, internal.resource.resourceEditOrgResourceProjectionsInternalMutation, {
      resourceId: args.resourceId,
      paginationOpts: { ...paginationOpts, cursor: result.continueCursor },
    })
  }

  return null
}

export async function updateAssignedFileIds(
  ctx: MutationCtx,
  resourceId: string,
  fileIds: string[],
): PromiseResult<null> {
  // Get current file assignments for this resource
  const existing = await ctx.db
    .query("resourceFiles")
    .withIndex("resourceId", (q) => q.eq("resourceId", resourceId))
    .collect()

  const currentFileIds = new Set(existing.map((e) => e.fileId))
  const newFileIds = new Set(fileIds)

  // Find files to add (in new but not in current)
  const toAdd = fileIds.filter((fileId) => !currentFileIds.has(fileId))

  // Find files to remove (in current but not in new)
  const toRemove = existing.filter((e) => !newFileIds.has(e.fileId))

  // Add new file assignments
  if (toAdd.length > 0) {
    const filesToAdd = await Promise.all(
      toAdd.map((fileId) =>
        ctx.db
          .query("files")
          .withIndex("fileId", (q) => q.eq("fileId", fileId))
          .first(),
      ),
    )
    for (const file of filesToAdd) {
      if (!file) continue
      const fileGuard = await assignmentCurrentGuardFn(ctx, { kind: "file", doc: file })
      if (!fileGuard.success) {
        return fileGuard
      }
      await ctx.db.insert("resourceFiles", {
        resourceId: resourceId,
        fileId: file.fileId,
        createdAt: nowIso(),
      })
      if (file.resourceId !== resourceId) {
        await ctx.db.patch("files", file._id, { resourceId })
      }
    }
  }

  // Remove old file assignments
  for (const assignment of toRemove) {
    await ctx.db.delete("resourceFiles", assignment._id)
    const file = await ctx.db
      .query("files")
      .withIndex("fileId", (q) => q.eq("fileId", assignment.fileId))
      .first()
    if (file && file.resourceId === resourceId) {
      await ctx.db.patch("files", file._id, { resourceId: undefined })
    }
  }

  return createResult(null)
}
