import { api } from "#convex/_generated/api.js"
import type { Id } from "#convex/_generated/dataModel.js"
import type { ActionCtx } from "#convex/_generated/server.js"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

function toolResult(result: unknown, isError = false) {
  return { content: [{ type: "text" as const, text: JSON.stringify(result) }], ...(isError && { isError: true }) }
}

const assignmentSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("organization"), id: z.string() }),
  z.object({ kind: z.literal("team"), id: z.string() }),
  z.object({ kind: z.literal("project"), id: z.string() }),
  z.object({ kind: z.literal("note"), id: z.string() }),
])

const resourceTypeSchema = z.enum([
  "strategy",
  "report",
  "policyDialogue",
  "training",
  "survey",
  "recommendation",
  "other",
])
const visibilitySchema = z.enum(["public", "member", "org"])
const orgRoleSchema = z.enum(["member", "guest"])
const apiKeyExpiryPresetSchema = z.enum(["never", "1-day", "1-week", "1-month", "1-year", "2-years", "3-years"])

export function mcpWriteToolsRegister(server: McpServer, ctx: ActionCtx, token: string): void {
  server.registerTool(
    "org-create",
    {
      description: "Create an organization.",
      inputSchema: {
        orgHandle: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        url: z.string().optional(),
        image: z.string().optional(),
      },
    },
    async (args) => {
      const result = await ctx.runMutation(api.org.orgCreateMutation, { token, ...args })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "org-update",
    {
      description: "Update an organization's profile fields.",
      inputSchema: {
        orgHandle: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        url: z.string().optional(),
        image: z.string().optional(),
      },
    },
    async (args) => {
      const result = await ctx.runMutation(api.org.orgEditMutation, { token, ...args })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "org-member-create",
    {
      description: "Add a user as a member of an organization.",
      inputSchema: { orgHandle: z.string(), userId: z.string(), role: orgRoleSchema },
    },
    async ({ orgHandle, userId, role }) => {
      const result = await ctx.runMutation(api.org.orgMemberCreateMutation, {
        token,
        orgHandle,
        userId: userId as Id<"users">,
        role,
      })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "org-member-update",
    {
      description: "Update an organization member's role.",
      inputSchema: { memberId: z.string(), orgHandle: z.string(), role: orgRoleSchema.optional() },
    },
    async ({ memberId, orgHandle, role }) => {
      const result = await ctx.runMutation(api.org.orgMemberEditMutation, { token, memberId, orgHandle, role })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "org-member-delete",
    {
      description: "Remove a member from an organization.",
      inputSchema: { memberId: z.string(), orgHandle: z.string() },
    },
    async ({ memberId, orgHandle }) => {
      const result = await ctx.runMutation(api.org.orgMemberDeleteMutation, { token, memberId, orgHandle })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "org-leave",
    { description: "Leave an organization.", inputSchema: { orgHandle: z.string() } },
    async ({ orgHandle }) => {
      const result = await ctx.runMutation(api.org.orgLeaveMutation, { token, orgHandle })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "org-invitation-initiate",
    {
      description: "Invite a person to join an organization.",
      inputSchema: {
        orgHandle: z.string(),
        invitedName: z.string(),
        invitedEmail: z.string(),
        l: z.enum(["en", "ru", "tj"]),
        role: orgRoleSchema,
      },
    },
    async (args) => {
      const result = await ctx.runMutation(api.org.orgInvitation20InitMutation, { token, ...args })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "org-invitation-resend",
    {
      description: "Resend an organization invitation.",
      inputSchema: { invitationCode: z.string(), l: z.enum(["en", "ru", "tj"]).optional() },
    },
    async ({ invitationCode, l }) => {
      const result = await ctx.runAction(api.org.orgInvitation30ResendAction, { token, invitationCode, l })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "org-invitation-accept",
    {
      description: "Accept an organization invitation.",
      inputSchema: { invitationCode: z.string(), orgHandle: z.string().optional() },
    },
    async ({ invitationCode, orgHandle }) => {
      const result = await ctx.runMutation(api.org.orgInvitation50AcceptMutation, { token, invitationCode, orgHandle })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "org-invitation-dismiss",
    {
      description: "Dismiss an organization invitation.",
      inputSchema: { invitationCode: z.string() },
    },
    async ({ invitationCode }) => {
      const result = await ctx.runMutation(api.org.orgInvitation60DismissMutation, { token, invitationCode })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "team-create",
    {
      description: "Create a team in an organization.",
      inputSchema: {
        orgId: z.string().optional(),
        orgHandle: z.string().optional(),
        name: z.string(),
        description: z.string().optional(),
      },
    },
    async ({ orgId, orgHandle, name, description }) => {
      const result = await ctx.runMutation(api.team.teamCreateMutation, {
        token,
        orgId: orgId as Id<"orgs"> | undefined,
        orgHandle,
        name,
        description,
      })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "team-update",
    {
      description: "Update a team's name and description.",
      inputSchema: {
        teamId: z.string(),
        orgId: z.string().optional(),
        orgHandle: z.string().optional(),
        name: z.string(),
        description: z.string().optional(),
      },
    },
    async ({ teamId, orgId, orgHandle, name, description }) => {
      const result = await ctx.runMutation(api.team.teamEditMutation, {
        token,
        teamId: teamId as Id<"teams">,
        orgId: orgId as Id<"orgs"> | undefined,
        orgHandle,
        name,
        description,
      })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "project-create",
    {
      description: "Create a project in a team.",
      inputSchema: {
        teamId: z.string(),
        orgId: z.string().optional(),
        orgHandle: z.string().optional(),
        name: z.string(),
        description: z.string().optional(),
      },
    },
    async ({ teamId, orgId, orgHandle, name, description }) => {
      const result = await ctx.runMutation(api.project.projectCreateMutation, {
        token,
        teamId: teamId as Id<"teams">,
        orgId: orgId as Id<"orgs"> | undefined,
        orgHandle,
        name,
        description,
      })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "project-update",
    {
      description: "Update a project's name and description.",
      inputSchema: {
        projectId: z.string(),
        orgId: z.string().optional(),
        orgHandle: z.string().optional(),
        teamId: z.string().optional(),
        name: z.string(),
        description: z.string().optional(),
      },
    },
    async ({ projectId, orgId, orgHandle, teamId, name, description }) => {
      const result = await ctx.runMutation(api.project.projectEditMutation, {
        token,
        projectId: projectId as Id<"projects">,
        orgId: orgId as Id<"orgs"> | undefined,
        orgHandle,
        teamId: teamId as Id<"teams"> | undefined,
        name,
        description,
      })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "note-create",
    {
      description: "Create a note in a project.",
      inputSchema: {
        projectId: z.string(),
        orgId: z.string().optional(),
        orgHandle: z.string().optional(),
        teamId: z.string().optional(),
        content: z.string(),
      },
    },
    async ({ projectId, orgId, orgHandle, teamId, content }) => {
      const result = await ctx.runMutation(api.note.noteCreateMutation, {
        token,
        projectId: projectId as Id<"projects">,
        orgId: orgId as Id<"orgs"> | undefined,
        orgHandle,
        teamId: teamId as Id<"teams"> | undefined,
        content,
      })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "note-update",
    {
      description: "Update a note's content.",
      inputSchema: {
        noteId: z.string(),
        orgId: z.string().optional(),
        orgHandle: z.string().optional(),
        teamId: z.string().optional(),
        projectId: z.string().optional(),
        content: z.string(),
      },
    },
    async ({ noteId, orgId, orgHandle, teamId, projectId, content }) => {
      const result = await ctx.runMutation(api.note.noteEditMutation, {
        token,
        noteId: noteId as Id<"notes">,
        orgId: orgId as Id<"orgs"> | undefined,
        orgHandle,
        teamId: teamId as Id<"teams"> | undefined,
        projectId: projectId as Id<"projects"> | undefined,
        content,
      })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "r2-upload-url-get",
    { description: "Get a signed R2 upload URL for a file ID.", inputSchema: { fileId: z.string() } },
    async ({ fileId }) => {
      const result = await ctx.runQuery(api.r2.r2UploadUrlGetQuery, { token, fileId })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "file-create",
    {
      description: "Create file metadata after uploading the file to R2.",
      inputSchema: {
        fileId: z.string(),
        url: z.string(),
        displayName: z.string(),
        fileSize: z.number().int().nonnegative(),
        contentType: z.string(),
        username: z.string().optional(),
        imageWidth: z.number().int().nonnegative().optional(),
        imageHeight: z.number().int().nonnegative().optional(),
        assignment: assignmentSchema.nullable().optional(),
        orgId: z.string().nullable().optional(),
        teamId: z.string().nullable().optional(),
        projectId: z.string().nullable().optional(),
        noteId: z.string().nullable().optional(),
        resourceId: z.string().nullable().optional(),
      },
    },
    async (args) => {
      const result = await ctx.runMutation(api.r2.r2FileCreateMutation, {
        token,
        ...args,
        orgId: args.orgId as Id<"orgs"> | null | undefined,
        teamId: args.teamId as Id<"teams"> | null | undefined,
        projectId: args.projectId as Id<"projects"> | null | undefined,
        noteId: args.noteId as Id<"notes"> | null | undefined,
      })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "file-get",
    {
      description: "Get file metadata by file ID.",
      inputSchema: { fileId: z.string(), updatedAt: z.string().optional() },
    },
    async ({ fileId, updatedAt }) => {
      const result = await ctx.runQuery(api.file.fileGetQuery, { token, fileId, updatedAt })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "resource-create",
    {
      description: "Create a resource.",
      inputSchema: {
        resourceId: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        type: resourceTypeSchema.optional(),
        visibility: visibilitySchema.optional(),
        image: z.string().optional(),
        language: z.enum(["en", "ru", "tj"]).optional(),
        assignment: assignmentSchema.nullable().optional(),
        orgId: z.string().nullable().optional(),
        teamId: z.string().nullable().optional(),
        projectId: z.string().nullable().optional(),
        noteId: z.string().nullable().optional(),
        fileIds: z.array(z.string()).optional(),
      },
    },
    async (args) => {
      const result = await ctx.runMutation(api.resource.resourceCreateMutation, {
        token,
        ...args,
        orgId: args.orgId as Id<"orgs"> | null | undefined,
        teamId: args.teamId as Id<"teams"> | null | undefined,
        projectId: args.projectId as Id<"projects"> | null | undefined,
        noteId: args.noteId as Id<"notes"> | null | undefined,
      })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "resource-update",
    {
      description: "Update a resource.",
      inputSchema: {
        resourceId: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        type: resourceTypeSchema.optional(),
        visibility: visibilitySchema.optional(),
        image: z.string().optional(),
        language: z.enum(["en", "ru", "tj"]).optional(),
        assignment: assignmentSchema.nullable().optional(),
        orgId: z.string().nullable().optional(),
        teamId: z.string().nullable().optional(),
        projectId: z.string().nullable().optional(),
        noteId: z.string().nullable().optional(),
        fileIds: z.array(z.string()).optional(),
      },
    },
    async (args) => {
      const result = await ctx.runMutation(api.resource.resourceEditMutation, {
        token,
        ...args,
        orgId: args.orgId as Id<"orgs"> | null | undefined,
        teamId: args.teamId as Id<"teams"> | null | undefined,
        projectId: args.projectId as Id<"projects"> | null | undefined,
        noteId: args.noteId as Id<"notes"> | null | undefined,
      })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "resource-delete",
    { description: "Delete a resource.", inputSchema: { resourceId: z.string() } },
    async ({ resourceId }) => {
      const result = await ctx.runMutation(api.resource.resourceDeleteMutation, { token, resourceId })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "resource-file-add",
    {
      description: "Associate a file with a resource.",
      inputSchema: { resourceId: z.string(), fileId: z.string() },
    },
    async ({ resourceId, fileId }) => {
      const result = await ctx.runMutation(api.resource.resourceFileAddMutation, { token, resourceId, fileId })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "resource-file-remove",
    {
      description: "Remove a file association from a resource.",
      inputSchema: { resourceId: z.string(), fileId: z.string() },
    },
    async ({ resourceId, fileId }) => {
      const result = await ctx.runMutation(api.resource.resourceFileRemoveMutation, { token, resourceId, fileId })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "file-edit",
    {
      description: "Edit file metadata or its resource and assignment links.",
      inputSchema: {
        fileId: z.string(),
        displayName: z.string().optional(),
        language: z.enum(["en", "ru", "tj", "none"]).optional(),
        resourceId: z.string().nullable().optional(),
        assignment: assignmentSchema.nullable().optional(),
        orgId: z.string().nullable().optional(),
        teamId: z.string().nullable().optional(),
        projectId: z.string().nullable().optional(),
        noteId: z.string().nullable().optional(),
      },
    },
    async (args) => {
      const result = await ctx.runMutation(api.file.fileEditMutation, {
        token,
        ...args,
        orgId: args.orgId as Id<"orgs"> | null | undefined,
        teamId: args.teamId as Id<"teams"> | null | undefined,
        projectId: args.projectId as Id<"projects"> | null | undefined,
        noteId: args.noteId as Id<"notes"> | null | undefined,
      })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "file-delete",
    { description: "Delete a file and remove its resource link.", inputSchema: { fileId: z.string() } },
    async ({ fileId }) => {
      const result = await ctx.runMutation(api.file.fileDeleteMutation, { token, fileId })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "api-key-create",
    {
      description:
        "Create an API key for your account. The returned plaintext credential is shown only once; store it securely now.",
      inputSchema: { name: z.string(), expiryPreset: apiKeyExpiryPresetSchema.optional() },
    },
    async ({ name, expiryPreset }) => {
      const result = await ctx.runMutation(api.auth.apiKeyCreateMutation, { token, name, expiryPreset })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "api-key-rename",
    {
      description: "Rename one of your API keys.",
      inputSchema: { id: z.string(), name: z.string() },
    },
    async ({ id, name }) => {
      const result = await ctx.runMutation(api.auth.apiKeyRenameMutation, {
        token,
        id: id as Id<"authApiKeys">,
        name,
      })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "api-key-revoke",
    { description: "Revoke one of your API keys.", inputSchema: { id: z.string() } },
    async ({ id }) => {
      const result = await ctx.runMutation(api.auth.apiKeyRevokeMutation, { token, id: id as Id<"authApiKeys"> })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "api-key-rotate",
    {
      description:
        "Rotate one of your API keys. The old key is revoked; the replacement plaintext credential is shown only once, so store it securely now.",
      inputSchema: { id: z.string() },
    },
    async ({ id }) => {
      const result = await ctx.runMutation(api.auth.apiKeyRotateMutation, { token, id: id as Id<"authApiKeys"> })
      return toolResult(result, !result.success)
    },
  )
}
