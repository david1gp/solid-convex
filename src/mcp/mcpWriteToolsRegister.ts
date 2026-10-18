import * as a from "valibot"
import { api } from "#convex/_generated/api.js"
import type { Id } from "#convex/_generated/dataModel.js"
import type { ActionCtx } from "#convex/_generated/server.js"
import { mcpToolSchemas } from "#src/mcp/mcpToolSchemas.ts"
import type { McpToolDefinition } from "#src/mcp/mcpToolRegistry.ts"
import { mcpToolResult } from "#src/mcp/mcpToolRegistry.ts"

const s = mcpToolSchemas

const mcpInputSchema0 = a.object({
  orgHandle: a.string(),
  name: a.optional(a.string()),
  description: a.optional(a.string()),
  url: a.optional(a.string()),
  image: a.optional(a.string()),
})
const mcpInputSchema1 = a.object({
  orgHandle: a.string(),
  name: a.optional(a.string()),
  description: a.optional(a.string()),
  url: a.optional(a.string()),
  image: a.optional(a.string()),
})
const mcpInputSchema2 = a.object({ orgHandle: a.string(), userId: a.string(), role: s.orgRole })
const mcpInputSchema3 = a.object({ memberId: a.string(), orgHandle: a.string(), role: s.orgRoleOptional })
const mcpInputSchema4 = a.object({ memberId: a.string(), orgHandle: a.string() })
const mcpInputSchema5 = a.object({ orgHandle: a.string() })
const mcpInputSchema6 = a.object({
  orgHandle: a.string(),
  invitedName: a.string(),
  invitedEmail: a.string(),
  l: s.language,
  role: s.orgRole,
})
const mcpInputSchema7 = a.object({ invitationCode: a.string(), l: s.languageOptional })
const mcpInputSchema8 = a.object({ invitationCode: a.string(), orgHandle: s.orgHandleOptional })
const mcpInputSchema9 = a.object({ invitationCode: a.string() })
const mcpInputSchema10 = a.object({
  orgId: s.orgIdOptional,
  orgHandle: s.orgHandleOptional,
  name: a.string(),
  description: a.optional(a.string()),
})
const mcpInputSchema11 = a.object({
  teamId: a.string(),
  orgId: s.orgIdOptional,
  orgHandle: s.orgHandleOptional,
  name: a.string(),
  description: a.optional(a.string()),
})
const mcpInputSchema12 = a.object({
  teamId: a.string(),
  orgId: s.orgIdOptional,
  orgHandle: s.orgHandleOptional,
  name: a.string(),
  description: a.optional(a.string()),
})
const mcpInputSchema13 = a.object({
  projectId: a.string(),
  orgId: s.orgIdOptional,
  orgHandle: s.orgHandleOptional,
  teamId: s.teamIdOptional,
  name: a.string(),
  description: a.optional(a.string()),
})
const mcpInputSchema14 = a.object({
  projectId: a.string(),
  orgId: s.orgIdOptional,
  orgHandle: s.orgHandleOptional,
  teamId: s.teamIdOptional,
  content: a.string(),
})
const mcpInputSchema15 = a.object({
  noteId: a.string(),
  orgId: s.orgIdOptional,
  orgHandle: s.orgHandleOptional,
  teamId: s.teamIdOptional,
  projectId: s.projectIdOptional,
  content: a.string(),
})
const mcpInputSchema16 = a.object({ fileId: a.string() })
const mcpInputSchema17 = a.object({
  fileId: a.string(),
  url: a.string(),
  displayName: a.string(),
  fileSize: s.nonNegativeInt,
  contentType: a.string(),
  username: a.optional(a.string()),
  imageWidth: s.nonNegativeIntOptional,
  imageHeight: s.nonNegativeIntOptional,
  assignment: s.assignment,
  orgId: s.nullableId,
  teamId: s.nullableId,
  projectId: s.nullableId,
  noteId: s.nullableId,
  resourceId: s.nullableId,
})
const mcpInputSchema18 = a.object({ fileId: a.string(), updatedAt: a.optional(a.string()) })
const mcpInputSchema19 = a.object({
  resourceId: a.string(),
  name: a.optional(a.string()),
  description: a.optional(a.string()),
  type: s.resourceTypeOptional,
  visibility: s.visibilityOptional,
  image: a.optional(a.string()),
  language: s.languageOptional,
  assignment: s.assignment,
  orgId: s.nullableId,
  teamId: s.nullableId,
  projectId: s.nullableId,
  noteId: s.nullableId,
  fileIds: s.arrayOfStringOptional,
})
const mcpInputSchema20 = a.object({
  resourceId: a.string(),
  name: a.optional(a.string()),
  description: a.optional(a.string()),
  type: s.resourceTypeOptional,
  visibility: s.visibilityOptional,
  image: a.optional(a.string()),
  language: s.languageOptional,
  assignment: s.assignment,
  orgId: s.nullableId,
  teamId: s.nullableId,
  projectId: s.nullableId,
  noteId: s.nullableId,
  fileIds: s.arrayOfStringOptional,
})
const mcpInputSchema21 = a.object({ resourceId: a.string() })
const mcpInputSchema22 = a.object({ resourceId: a.string(), fileId: a.string() })
const mcpInputSchema23 = a.object({ resourceId: a.string(), fileId: a.string() })
const mcpInputSchema24 = a.object({
  fileId: a.string(),
  displayName: a.optional(a.string()),
  language: s.languageOrNoneOptional,
  resourceId: s.nullableId,
  assignment: s.assignment,
  orgId: s.nullableId,
  teamId: s.nullableId,
  projectId: s.nullableId,
  noteId: s.nullableId,
})
const mcpInputSchema25 = a.object({ fileId: a.string() })
const mcpInputSchema26 = a.object({ name: s.apiKeyName, expiryPreset: s.apiKeyExpiryPresetOptional })
const mcpInputSchema27 = a.object({ id: s.apiKeyId, name: s.apiKeyName })
const mcpInputSchema28 = a.object({ id: s.apiKeyId })
const mcpInputSchema29 = a.object({ id: s.apiKeyId })

export function mcpWriteToolDefinitions(ctx: ActionCtx, token: string): McpToolDefinition[] {
  return [
    {
      name: "org-create",
      description: "Create an organization.",
      inputSchema: mcpInputSchema0,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema0>) => {
        const args = toolArgs

        const result = await ctx.runMutation(api.org.orgCreateMutation, { token, ...args })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "org-update",
      description: "Update an organization's profile fields.",
      inputSchema: mcpInputSchema1,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema1>) => {
        const args = toolArgs

        const result = await ctx.runMutation(api.org.orgEditMutation, { token, ...args })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "org-member-create",
      description: "Add a user as a member of an organization.",
      inputSchema: mcpInputSchema2,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema2>) => {
        const { orgHandle, userId, role } = toolArgs

        const result = await ctx.runMutation(api.org.orgMemberCreateMutation, {
          token,
          orgHandle,
          userId: userId as Id<"users">,
          role,
        })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "org-member-update",
      description: "Update an organization member's role.",
      inputSchema: mcpInputSchema3,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema3>) => {
        const { memberId, orgHandle, role } = toolArgs

        const result = await ctx.runMutation(api.org.orgMemberEditMutation, { token, memberId, orgHandle, role })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "org-member-delete",
      description: "Remove a member from an organization.",
      inputSchema: mcpInputSchema4,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema4>) => {
        const { memberId, orgHandle } = toolArgs

        const result = await ctx.runMutation(api.org.orgMemberDeleteMutation, { token, memberId, orgHandle })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "org-leave",
      description: "Leave an organization.",
      inputSchema: mcpInputSchema5,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema5>) => {
        const { orgHandle } = toolArgs

        const result = await ctx.runMutation(api.org.orgLeaveMutation, { token, orgHandle })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "org-invitation-initiate",
      description: "Invite a person to join an organization.",
      inputSchema: mcpInputSchema6,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema6>) => {
        const args = toolArgs

        const result = await ctx.runMutation(api.org.orgInvitation20InitMutation, { token, ...args })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "org-invitation-resend",
      description: "Resend an organization invitation.",
      inputSchema: mcpInputSchema7,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema7>) => {
        const { invitationCode, l } = toolArgs

        const result = await ctx.runAction(api.org.orgInvitation30ResendAction, { token, invitationCode, l })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "org-invitation-accept",
      description: "Accept an organization invitation.",
      inputSchema: mcpInputSchema8,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema8>) => {
        const { invitationCode, orgHandle } = toolArgs

        const result = await ctx.runMutation(api.org.orgInvitation50AcceptMutation, {
          token,
          invitationCode,
          orgHandle,
        })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "org-invitation-dismiss",
      description: "Dismiss an organization invitation.",
      inputSchema: mcpInputSchema9,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema9>) => {
        const { invitationCode } = toolArgs

        const result = await ctx.runMutation(api.org.orgInvitation60DismissMutation, { token, invitationCode })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "team-create",
      description: "Create a team in an organization.",
      inputSchema: mcpInputSchema10,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema10>) => {
        const { orgId, orgHandle, name, description } = toolArgs

        const result = await ctx.runMutation(api.team.teamCreateMutation, {
          token,
          orgId: orgId as Id<"orgs"> | undefined,
          orgHandle,
          name,
          description,
        })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "team-update",
      description: "Update a team's name and description.",
      inputSchema: mcpInputSchema11,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema11>) => {
        const { teamId, orgId, orgHandle, name, description } = toolArgs

        const result = await ctx.runMutation(api.team.teamEditMutation, {
          token,
          teamId: teamId as Id<"teams">,
          orgId: orgId as Id<"orgs"> | undefined,
          orgHandle,
          name,
          description,
        })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "project-create",
      description: "Create a project in a team.",
      inputSchema: mcpInputSchema12,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema12>) => {
        const { teamId, orgId, orgHandle, name, description } = toolArgs

        const result = await ctx.runMutation(api.project.projectCreateMutation, {
          token,
          teamId: teamId as Id<"teams">,
          orgId: orgId as Id<"orgs"> | undefined,
          orgHandle,
          name,
          description,
        })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "project-update",
      description: "Update a project's name and description.",
      inputSchema: mcpInputSchema13,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema13>) => {
        const { projectId, orgId, orgHandle, teamId, name, description } = toolArgs

        const result = await ctx.runMutation(api.project.projectEditMutation, {
          token,
          projectId: projectId as Id<"projects">,
          orgId: orgId as Id<"orgs"> | undefined,
          orgHandle,
          teamId: teamId as Id<"teams"> | undefined,
          name,
          description,
        })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "note-create",
      description: "Create a note in a project.",
      inputSchema: mcpInputSchema14,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema14>) => {
        const { projectId, orgId, orgHandle, teamId, content } = toolArgs

        const result = await ctx.runMutation(api.note.noteCreateMutation, {
          token,
          projectId: projectId as Id<"projects">,
          orgId: orgId as Id<"orgs"> | undefined,
          orgHandle,
          teamId: teamId as Id<"teams"> | undefined,
          content,
        })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "note-update",
      description: "Update a note's content.",
      inputSchema: mcpInputSchema15,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema15>) => {
        const { noteId, orgId, orgHandle, teamId, projectId, content } = toolArgs

        const result = await ctx.runMutation(api.note.noteEditMutation, {
          token,
          noteId: noteId as Id<"notes">,
          orgId: orgId as Id<"orgs"> | undefined,
          orgHandle,
          teamId: teamId as Id<"teams"> | undefined,
          projectId: projectId as Id<"projects"> | undefined,
          content,
        })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "r2-upload-url-get",
      description: "Get a signed R2 upload URL for a file ID.",
      inputSchema: mcpInputSchema16,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema16>) => {
        const { fileId } = toolArgs

        const result = await ctx.runQuery(api.r2.r2UploadUrlGetQuery, { token, fileId })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "file-create",
      description: "Create file metadata after uploading the file to R2.",
      inputSchema: mcpInputSchema17,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema17>) => {
        const args = toolArgs

        const result = await ctx.runMutation(api.r2.r2FileCreateMutation, {
          token,
          ...args,
          orgId: args.orgId as Id<"orgs"> | null | undefined,
          teamId: args.teamId as Id<"teams"> | null | undefined,
          projectId: args.projectId as Id<"projects"> | null | undefined,
          noteId: args.noteId as Id<"notes"> | null | undefined,
        })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "file-get",
      description: "Get file metadata by file ID.",
      inputSchema: mcpInputSchema18,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema18>) => {
        const { fileId, updatedAt } = toolArgs

        const result = await ctx.runQuery(api.file.fileGetQuery, { token, fileId, updatedAt })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "resource-create",
      description: "Create a resource.",
      inputSchema: mcpInputSchema19,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema19>) => {
        const args = toolArgs

        const result = await ctx.runMutation(api.resource.resourceCreateMutation, {
          token,
          ...args,
          orgId: args.orgId as Id<"orgs"> | null | undefined,
          teamId: args.teamId as Id<"teams"> | null | undefined,
          projectId: args.projectId as Id<"projects"> | null | undefined,
          noteId: args.noteId as Id<"notes"> | null | undefined,
        })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "resource-update",
      description: "Update a resource.",
      inputSchema: mcpInputSchema20,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema20>) => {
        const args = toolArgs

        const result = await ctx.runMutation(api.resource.resourceEditMutation, {
          token,
          ...args,
          orgId: args.orgId as Id<"orgs"> | null | undefined,
          teamId: args.teamId as Id<"teams"> | null | undefined,
          projectId: args.projectId as Id<"projects"> | null | undefined,
          noteId: args.noteId as Id<"notes"> | null | undefined,
        })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "resource-delete",
      description: "Delete a resource.",
      inputSchema: mcpInputSchema21,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema21>) => {
        const { resourceId } = toolArgs

        const result = await ctx.runMutation(api.resource.resourceDeleteMutation, { token, resourceId })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "resource-file-add",
      description: "Associate a file with a resource.",
      inputSchema: mcpInputSchema22,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema22>) => {
        const { resourceId, fileId } = toolArgs

        const result = await ctx.runMutation(api.resource.resourceFileAddMutation, { token, resourceId, fileId })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "resource-file-remove",
      description: "Remove a file association from a resource.",
      inputSchema: mcpInputSchema23,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema23>) => {
        const { resourceId, fileId } = toolArgs

        const result = await ctx.runMutation(api.resource.resourceFileRemoveMutation, { token, resourceId, fileId })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "file-edit",
      description: "Edit file metadata or its resource and assignment links.",
      inputSchema: mcpInputSchema24,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema24>) => {
        const args = toolArgs

        const result = await ctx.runMutation(api.file.fileEditMutation, {
          token,
          ...args,
          orgId: args.orgId as Id<"orgs"> | null | undefined,
          teamId: args.teamId as Id<"teams"> | null | undefined,
          projectId: args.projectId as Id<"projects"> | null | undefined,
          noteId: args.noteId as Id<"notes"> | null | undefined,
        })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "file-delete",
      description: "Delete a file and remove its resource link.",
      inputSchema: mcpInputSchema25,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema25>) => {
        const { fileId } = toolArgs

        const result = await ctx.runMutation(api.file.fileDeleteMutation, { token, fileId })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "api-key-create",
      description:
        "Create an API key for your account. The returned plaintext credential is shown only once; store it securely now.",
      inputSchema: mcpInputSchema26,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema26>) => {
        const { name, expiryPreset } = toolArgs

        const result = await ctx.runMutation(api.auth.apiKeyCreateMutation, { token, name, expiryPreset })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "api-key-rename",
      description: "Rename one of your API keys.",
      inputSchema: mcpInputSchema27,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema27>) => {
        const { id, name } = toolArgs

        const result = await ctx.runMutation(api.auth.apiKeyRenameMutation, {
          token,
          id: id as Id<"authApiKeys">,
          name,
        })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "api-key-revoke",
      description: "Revoke one of your API keys.",
      inputSchema: mcpInputSchema28,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema28>) => {
        const { id } = toolArgs

        const result = await ctx.runMutation(api.auth.apiKeyRevokeMutation, { token, id: id as Id<"authApiKeys"> })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "api-key-rotate",
      description:
        "Rotate one of your API keys. The old key is revoked; the replacement plaintext credential is shown only once, so store it securely now.",
      inputSchema: mcpInputSchema29,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema29>) => {
        const { id } = toolArgs

        const result = await ctx.runMutation(api.auth.apiKeyRotateMutation, { token, id: id as Id<"authApiKeys"> })
        return mcpToolResult(result, !result.success)
      },
    },
  ]
}
