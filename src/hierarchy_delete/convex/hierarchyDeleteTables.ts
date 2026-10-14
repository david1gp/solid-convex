import { defineTable } from "convex/server"
import { v } from "convex/values"
import { valibotToConvex } from "#src/utils/convex/valibotToConvex.ts"
import { fieldsSchemaCreatedAtUpdatedAt } from "#src/utils/data/fieldsSchemaCreatedAtUpdatedAt.ts"

export const hierarchyDeleteTables = {
  hierarchyDeleteSnapshots: defineTable({
    rootKind: v.union(v.literal("org"), v.literal("team"), v.literal("project"), v.literal("note")),
    rootId: v.string(),
    fingerprint: v.string(),
    counts: v.object({
      orgs: v.number(),
      teams: v.number(),
      projects: v.number(),
      notes: v.number(),
      resources: v.number(),
      files: v.number(),
      orgMembers: v.optional(v.number()),
      orgInvitations: v.optional(v.number()),
      total: v.number(),
    }),
    scope: v.object({
      orgIds: v.array(v.string()),
      teamIds: v.array(v.string()),
      projectIds: v.array(v.string()),
      noteIds: v.array(v.string()),
      resourceIds: v.array(v.string()),
      fileIds: v.array(v.string()),
      orgMemberIds: v.optional(v.array(v.string())),
      orgInvitationIds: v.optional(v.array(v.string())),
    }),
    isTruncated: v.boolean(),
    ...valibotToConvex(fieldsSchemaCreatedAtUpdatedAt),
  })
    .index("fingerprint", ["fingerprint"])
    .index("rootId", ["rootId"]),

  hierarchyDeleteJobs: defineTable({
    rootKind: v.union(v.literal("org"), v.literal("team"), v.literal("project"), v.literal("note")),
    rootId: v.string(),
    rootName: v.optional(v.string()),
    orgHandle: v.optional(v.string()),
    fingerprint: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("error"),
    ),
    phase: v.optional(
      v.union(
        v.literal("delete_r2_objects"),
        v.literal("delete_file_records"),
        v.literal("delete_resources"),
        v.literal("delete_notes"),
        v.literal("delete_projects"),
        v.literal("cleanup_teams_zitadel"),
        v.literal("delete_teams"),
        v.literal("delete_org_members"),
        v.literal("delete_org_roots"),
        v.literal("completed"),
      ),
    ),
    cursor: v.optional(v.number()),
    isRetryable: v.optional(v.boolean()),
    counts: v.object({
      orgs: v.number(),
      teams: v.number(),
      projects: v.number(),
      notes: v.number(),
      resources: v.number(),
      files: v.number(),
      orgMembers: v.optional(v.number()),
      orgInvitations: v.optional(v.number()),
      total: v.number(),
    }),
    scope: v.object({
      orgIds: v.array(v.string()),
      teamIds: v.array(v.string()),
      projectIds: v.array(v.string()),
      noteIds: v.array(v.string()),
      resourceIds: v.array(v.string()),
      fileIds: v.array(v.string()),
      orgMemberIds: v.optional(v.array(v.string())),
      orgInvitationIds: v.optional(v.array(v.string())),
    }),
    requestedByUserId: v.string(),
    error: v.optional(v.string()),
    ...valibotToConvex(fieldsSchemaCreatedAtUpdatedAt),
  })
    .index("rootId", ["rootId"])
    .index("status", ["status"])
    .index("fingerprint", ["fingerprint"])
    .index("rootKindAndRootId", ["rootKind", "rootId"]),
} as const
