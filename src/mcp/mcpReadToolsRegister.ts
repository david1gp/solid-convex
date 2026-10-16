import { api } from "#convex/_generated/api.js"
import type { Id } from "#convex/_generated/dataModel.js"
import type { ActionCtx } from "#convex/_generated/server.js"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

const paginationOptsSchema = z
  .object({
    numItems: z.number().int().min(1).max(100),
    cursor: z.string().nullable(),
  })
  .optional()

function toolResult(result: unknown, isError = false) {
  return { content: [{ type: "text" as const, text: JSON.stringify(result) }], ...(isError && { isError: true }) }
}

export function mcpReadToolsRegister(server: McpServer, ctx: ActionCtx, token: string): void {
  server.registerTool(
    "org-list",
    {
      description: "List organizations.",
      inputSchema: { paginationOpts: paginationOptsSchema },
    },
    async ({ paginationOpts }) => {
      const result = await ctx.runQuery(api.org.orgListQuery, { token, paginationOpts })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "org-get",
    {
      description: "Get an organization by handle.",
      inputSchema: { orgHandle: z.string(), updatedAt: z.string().optional() },
    },
    async ({ orgHandle, updatedAt }) => {
      const result = await ctx.runQuery(api.org.orgGetQuery, { token, orgHandle, updatedAt })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "org-get-page",
    {
      description: "Get organization page data by handle.",
      inputSchema: { orgHandle: z.string() },
    },
    async ({ orgHandle }) => {
      const result = await ctx.runQuery(api.org.orgGetPageQuery, { token, orgHandle })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "org-handle-available",
    {
      description: "Check whether an organization handle is available.",
      inputSchema: { orgHandle: z.string() },
    },
    async ({ orgHandle }) => {
      const result = await ctx.runQuery(api.org.orgHandleAvailableQuery, { token, orgHandle })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "org-member-list",
    {
      description: "List members of an organization.",
      inputSchema: { orgHandle: z.string(), paginationOpts: paginationOptsSchema },
    },
    async ({ orgHandle, paginationOpts }) => {
      const result = await ctx.runQuery(api.org.orgMembersListQuery, { token, orgHandle, paginationOpts })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "org-member-get",
    {
      description: "Get an organization member by ID.",
      inputSchema: { orgHandle: z.string(), memberId: z.string(), updatedAt: z.string().optional() },
    },
    async ({ orgHandle, memberId, updatedAt }) => {
      const result = await ctx.runQuery(api.org.orgMemberGetQuery, { token, orgHandle, memberId, updatedAt })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "org-invitation-list",
    {
      description: "List invitations for an organization.",
      inputSchema: { orgHandle: z.string(), paginationOpts: paginationOptsSchema },
    },
    async ({ orgHandle, paginationOpts }) => {
      const result = await ctx.runQuery(api.org.orgInvitationsListQuery, { token, orgHandle, paginationOpts })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "org-invitation-get",
    {
      description: "Get an organization invitation by code.",
      inputSchema: {
        invitationCode: z.string(),
        orgHandle: z.string().optional(),
        updatedAt: z.string().optional(),
      },
    },
    async ({ invitationCode, orgHandle, updatedAt }) => {
      const result = await ctx.runQuery(api.org.orgInvitationGetQuery, { invitationCode, orgHandle, updatedAt })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "team-list",
    {
      description: "List teams, optionally scoped to an organization.",
      inputSchema: {
        orgId: z.string().optional(),
        orgHandle: z.string().optional(),
        paginationOpts: paginationOptsSchema,
      },
    },
    async ({ orgId, orgHandle, paginationOpts }) => {
      const result = await ctx.runQuery(api.team.teamListQuery, {
        token,
        orgId: orgId as Id<"orgs"> | undefined,
        orgHandle,
        paginationOpts,
      })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "team-get",
    {
      description: "Get a team by ID.",
      inputSchema: { teamId: z.string(), orgId: z.string().optional(), orgHandle: z.string().optional() },
    },
    async ({ teamId, orgId, orgHandle }) => {
      const result = await ctx.runQuery(api.team.teamGetQuery, {
        token,
        teamId,
        orgId: orgId as Id<"orgs"> | undefined,
        orgHandle,
      })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "project-list",
    {
      description: "List projects, optionally scoped to an organization or team.",
      inputSchema: {
        orgId: z.string().optional(),
        orgHandle: z.string().optional(),
        teamId: z.string().optional(),
        paginationOpts: paginationOptsSchema,
      },
    },
    async ({ orgId, orgHandle, teamId, paginationOpts }) => {
      const result = await ctx.runQuery(api.project.projectListQuery, {
        token,
        orgId: orgId as Id<"orgs"> | undefined,
        orgHandle,
        teamId: teamId as Id<"teams"> | undefined,
        paginationOpts,
      })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "project-get",
    {
      description: "Get a project by ID.",
      inputSchema: {
        projectId: z.string(),
        orgId: z.string().optional(),
        orgHandle: z.string().optional(),
        teamId: z.string().optional(),
      },
    },
    async ({ projectId, orgId, orgHandle, teamId }) => {
      const result = await ctx.runQuery(api.project.projectGetQuery, {
        token,
        projectId,
        orgId: orgId as Id<"orgs"> | undefined,
        orgHandle,
        teamId: teamId as Id<"teams"> | undefined,
      })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "note-list",
    {
      description: "List notes, optionally scoped to an organization, team, or project.",
      inputSchema: {
        orgId: z.string().optional(),
        orgHandle: z.string().optional(),
        teamId: z.string().optional(),
        projectId: z.string().optional(),
        paginationOpts: paginationOptsSchema,
      },
    },
    async ({ orgId, orgHandle, teamId, projectId, paginationOpts }) => {
      const result = await ctx.runQuery(api.note.noteListQuery, {
        token,
        orgId: orgId as Id<"orgs"> | undefined,
        orgHandle,
        teamId: teamId as Id<"teams"> | undefined,
        projectId: projectId as Id<"projects"> | undefined,
        paginationOpts,
      })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "note-get",
    {
      description: "Get a note by ID.",
      inputSchema: {
        noteId: z.string(),
        orgId: z.string().optional(),
        orgHandle: z.string().optional(),
        teamId: z.string().optional(),
        projectId: z.string().optional(),
      },
    },
    async ({ noteId, orgId, orgHandle, teamId, projectId }) => {
      const result = await ctx.runQuery(api.note.noteGetQuery, {
        token,
        noteId,
        orgId: orgId as Id<"orgs"> | undefined,
        orgHandle,
        teamId: teamId as Id<"teams"> | undefined,
        projectId: projectId as Id<"projects"> | undefined,
      })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "resource-list",
    {
      description: "List resources, optionally filtered by organization, meeting, type, visibility, language, or text.",
      inputSchema: {
        l: z.enum(["en", "ru", "tj"]).optional(),
        orgHandle: z.string().optional(),
        meetingId: z.string().optional(),
        type: z
          .enum(["strategy", "report", "policyDialogue", "training", "survey", "recommendation", "other"])
          .optional(),
        visibility: z.enum(["public", "member", "org"]).optional(),
        searchText: z.string().optional(),
        paginationOpts: paginationOptsSchema,
      },
    },
    async ({ l, orgHandle, meetingId, type, visibility, searchText, paginationOpts }) => {
      const result = await ctx.runQuery(api.resource.resourcesListQuery, {
        token,
        l,
        orgHandle,
        meetingId,
        type,
        visibility,
        searchText,
        paginationOpts,
      })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "resource-get",
    {
      description: "Get a resource by ID.",
      inputSchema: { resourceId: z.string(), updatedAt: z.string().optional() },
    },
    async ({ resourceId, updatedAt }) => {
      const result = await ctx.runQuery(api.resource.resourceGetQuery, { token, resourceId, updatedAt })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "file-list",
    {
      description: "List files accessible to the authenticated user.",
      inputSchema: { paginationOpts: paginationOptsSchema },
    },
    async ({ paginationOpts }) => {
      const result = await ctx.runQuery(api.file.filesListQuery, { token, paginationOpts })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "resource-delete-preview",
    {
      description: "Preview the files that would be affected by deleting a resource.",
      inputSchema: { resourceId: z.string(), limit: z.number().int().nonnegative().optional() },
    },
    async ({ resourceId, limit }) => {
      const result = await ctx.runQuery(api.resource.resourceDeletePreviewQuery, { token, resourceId, limit })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "resource-file-list",
    {
      description: "List files linked to a resource.",
      inputSchema: { resourceId: z.string(), paginationOpts: paginationOptsSchema },
    },
    async ({ resourceId, paginationOpts }) => {
      const result = await ctx.runQuery(api.resource.resourceFileListQuery, { token, resourceId, paginationOpts })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "resource-files-get",
    {
      description: "Get a resource and a page of its linked files, optionally checking for updates.",
      inputSchema: {
        resourceId: z.string(),
        updatedAt: z.string().optional(),
        paginationOpts: paginationOptsSchema,
      },
    },
    async ({ resourceId, updatedAt, paginationOpts }) => {
      const result = await ctx.runQuery(api.resource.resourceFilesGetQuery, {
        token,
        resourceId,
        updatedAt,
        paginationOpts,
      })
      return toolResult(result, !result.success)
    },
  )

  server.registerTool(
    "api-key-list",
    {
      description: "List your API keys. Credentials are masked; plaintext keys are never returned by this tool.",
      inputSchema: { paginationOpts: paginationOptsSchema },
    },
    async ({ paginationOpts }) => {
      const result = await ctx.runQuery(api.auth.apiKeyListQuery, {
        token,
        paginationOpts: paginationOpts ?? { numItems: 20, cursor: null },
      })
      return toolResult(result, !result.success)
    },
  )
}
