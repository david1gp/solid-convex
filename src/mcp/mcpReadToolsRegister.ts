import * as a from "valibot"
import { api } from "#convex/_generated/api.js"
import type { Id } from "#convex/_generated/dataModel.js"
import type { ActionCtx } from "#convex/_generated/server.js"
import { mcpToolSchemas } from "#src/mcp/mcpToolSchemas.ts"
import type { McpToolDefinition } from "#src/mcp/mcpToolRegistry.ts"
import { mcpToolResult } from "#src/mcp/mcpToolRegistry.ts"

const s = mcpToolSchemas

const mcpInputSchema0 = a.object({ paginationOpts: s.paginationOpts })
const mcpInputSchema1 = a.object({ orgHandle: a.string(), updatedAt: s.updatedAtOptional })
const mcpInputSchema2 = a.object({ orgHandle: a.string() })
const mcpInputSchema3 = a.object({ orgHandle: a.string() })
const mcpInputSchema4 = a.object({ orgHandle: a.string(), paginationOpts: s.paginationOpts })
const mcpInputSchema5 = a.object({ orgHandle: a.string(), memberId: a.string(), updatedAt: s.updatedAtOptional })
const mcpInputSchema6 = a.object({ orgHandle: a.string(), paginationOpts: s.paginationOpts })
const mcpInputSchema7 = a.object({
  invitationCode: a.string(),
  orgHandle: s.orgHandleOptional,
  updatedAt: s.updatedAtOptional,
})
const mcpInputSchema8 = a.object({
  orgId: s.orgIdOptional,
  orgHandle: s.orgHandleOptional,
  paginationOpts: s.paginationOpts,
})
const mcpInputSchema9 = a.object({ teamId: a.string(), orgId: s.orgIdOptional, orgHandle: s.orgHandleOptional })
const mcpInputSchema10 = a.object({
  orgId: s.orgIdOptional,
  orgHandle: s.orgHandleOptional,
  teamId: s.teamIdOptional,
  paginationOpts: s.paginationOpts,
})
const mcpInputSchema11 = a.object({
  projectId: a.string(),
  orgId: s.orgIdOptional,
  orgHandle: s.orgHandleOptional,
  teamId: s.teamIdOptional,
})
const mcpInputSchema12 = a.object({
  orgId: s.orgIdOptional,
  orgHandle: s.orgHandleOptional,
  teamId: s.teamIdOptional,
  projectId: s.projectIdOptional,
  paginationOpts: s.paginationOpts,
})
const mcpInputSchema13 = a.object({
  noteId: a.string(),
  orgId: s.orgIdOptional,
  orgHandle: s.orgHandleOptional,
  teamId: s.teamIdOptional,
  projectId: s.projectIdOptional,
})
const mcpInputSchema14 = a.object({
  l: s.languageOptional,
  orgHandle: s.orgHandleOptional,
  meetingId: a.optional(a.string()),
  type: s.resourceTypeOptional,
  visibility: s.visibilityOptional,
  searchText: a.optional(a.string()),
  paginationOpts: s.paginationOpts,
})
const mcpInputSchema15 = a.object({ resourceId: a.string(), updatedAt: s.updatedAtOptional })
const mcpInputSchema16 = a.object({ paginationOpts: s.paginationOpts })
const mcpInputSchema17 = a.object({ resourceId: a.string(), limit: s.nonNegativeIntOptional })
const mcpInputSchema18 = a.object({ resourceId: a.string(), paginationOpts: s.paginationOpts })
const mcpInputSchema19 = a.object({
  resourceId: a.string(),
  updatedAt: s.updatedAtOptional,
  paginationOpts: s.paginationOpts,
})
const mcpInputSchema20 = a.object({ paginationOpts: s.paginationOpts })

export function mcpReadToolDefinitions(ctx: ActionCtx, token: string): McpToolDefinition[] {
  return [
    {
      name: "org-list",
      description: "List organizations.",
      inputSchema: mcpInputSchema0,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema0>) => {
        const { paginationOpts } = toolArgs

        const result = await ctx.runQuery(api.org.orgListQuery, { token, paginationOpts })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "org-get",
      description: "Get an organization by handle.",
      inputSchema: mcpInputSchema1,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema1>) => {
        const { orgHandle, updatedAt } = toolArgs

        const result = await ctx.runQuery(api.org.orgGetQuery, { token, orgHandle, updatedAt })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "org-get-page",
      description: "Get organization page data by handle.",
      inputSchema: mcpInputSchema2,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema2>) => {
        const { orgHandle } = toolArgs

        const result = await ctx.runQuery(api.org.orgGetPageQuery, { token, orgHandle })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "org-handle-available",
      description: "Check whether an organization handle is available.",
      inputSchema: mcpInputSchema3,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema3>) => {
        const { orgHandle } = toolArgs

        const result = await ctx.runQuery(api.org.orgHandleAvailableQuery, { token, orgHandle })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "org-member-list",
      description: "List members of an organization.",
      inputSchema: mcpInputSchema4,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema4>) => {
        const { orgHandle, paginationOpts } = toolArgs

        const result = await ctx.runQuery(api.org.orgMembersListQuery, { token, orgHandle, paginationOpts })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "org-member-get",
      description: "Get an organization member by ID.",
      inputSchema: mcpInputSchema5,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema5>) => {
        const { orgHandle, memberId, updatedAt } = toolArgs

        const result = await ctx.runQuery(api.org.orgMemberGetQuery, { token, orgHandle, memberId, updatedAt })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "org-invitation-list",
      description: "List invitations for an organization.",
      inputSchema: mcpInputSchema6,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema6>) => {
        const { orgHandle, paginationOpts } = toolArgs

        const result = await ctx.runQuery(api.org.orgInvitationsListQuery, { token, orgHandle, paginationOpts })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "org-invitation-get",
      description: "Get an organization invitation by code.",
      inputSchema: mcpInputSchema7,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema7>) => {
        const { invitationCode, orgHandle, updatedAt } = toolArgs

        const result = await ctx.runQuery(api.org.orgInvitationGetQuery, { invitationCode, orgHandle, updatedAt })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "team-list",
      description: "List teams, optionally scoped to an organization.",
      inputSchema: mcpInputSchema8,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema8>) => {
        const { orgId, orgHandle, paginationOpts } = toolArgs

        const result = await ctx.runQuery(api.team.teamListQuery, {
          token,
          orgId: orgId as Id<"orgs"> | undefined,
          orgHandle,
          paginationOpts,
        })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "team-get",
      description: "Get a team by ID.",
      inputSchema: mcpInputSchema9,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema9>) => {
        const { teamId, orgId, orgHandle } = toolArgs

        const result = await ctx.runQuery(api.team.teamGetQuery, {
          token,
          teamId,
          orgId: orgId as Id<"orgs"> | undefined,
          orgHandle,
        })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "project-list",
      description: "List projects, optionally scoped to an organization or team.",
      inputSchema: mcpInputSchema10,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema10>) => {
        const { orgId, orgHandle, teamId, paginationOpts } = toolArgs

        const result = await ctx.runQuery(api.project.projectListQuery, {
          token,
          orgId: orgId as Id<"orgs"> | undefined,
          orgHandle,
          teamId: teamId as Id<"teams"> | undefined,
          paginationOpts,
        })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "project-get",
      description: "Get a project by ID.",
      inputSchema: mcpInputSchema11,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema11>) => {
        const { projectId, orgId, orgHandle, teamId } = toolArgs

        const result = await ctx.runQuery(api.project.projectGetQuery, {
          token,
          projectId,
          orgId: orgId as Id<"orgs"> | undefined,
          orgHandle,
          teamId: teamId as Id<"teams"> | undefined,
        })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "note-list",
      description: "List notes, optionally scoped to an organization, team, or project.",
      inputSchema: mcpInputSchema12,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema12>) => {
        const { orgId, orgHandle, teamId, projectId, paginationOpts } = toolArgs

        const result = await ctx.runQuery(api.note.noteListQuery, {
          token,
          orgId: orgId as Id<"orgs"> | undefined,
          orgHandle,
          teamId: teamId as Id<"teams"> | undefined,
          projectId: projectId as Id<"projects"> | undefined,
          paginationOpts,
        })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "note-get",
      description: "Get a note by ID.",
      inputSchema: mcpInputSchema13,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema13>) => {
        const { noteId, orgId, orgHandle, teamId, projectId } = toolArgs

        const result = await ctx.runQuery(api.note.noteGetQuery, {
          token,
          noteId,
          orgId: orgId as Id<"orgs"> | undefined,
          orgHandle,
          teamId: teamId as Id<"teams"> | undefined,
          projectId: projectId as Id<"projects"> | undefined,
        })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "resource-list",
      description: "List resources, optionally filtered by organization, meeting, type, visibility, language, or text.",
      inputSchema: mcpInputSchema14,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema14>) => {
        const { l, orgHandle, meetingId, type, visibility, searchText, paginationOpts } = toolArgs

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
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "resource-get",
      description: "Get a resource by ID.",
      inputSchema: mcpInputSchema15,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema15>) => {
        const { resourceId, updatedAt } = toolArgs

        const result = await ctx.runQuery(api.resource.resourceGetQuery, { token, resourceId, updatedAt })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "file-list",
      description: "List files accessible to the authenticated user.",
      inputSchema: mcpInputSchema16,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema16>) => {
        const { paginationOpts } = toolArgs

        const result = await ctx.runQuery(api.file.filesListQuery, { token, paginationOpts })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "resource-delete-preview",
      description: "Preview the files that would be affected by deleting a resource.",
      inputSchema: mcpInputSchema17,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema17>) => {
        const { resourceId, limit } = toolArgs

        const result = await ctx.runQuery(api.resource.resourceDeletePreviewQuery, { token, resourceId, limit })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "resource-file-list",
      description: "List files linked to a resource.",
      inputSchema: mcpInputSchema18,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema18>) => {
        const { resourceId, paginationOpts } = toolArgs

        const result = await ctx.runQuery(api.resource.resourceFileListQuery, { token, resourceId, paginationOpts })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "resource-files-get",
      description: "Get a resource and a page of its linked files, optionally checking for updates.",
      inputSchema: mcpInputSchema19,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema19>) => {
        const { resourceId, updatedAt, paginationOpts } = toolArgs

        const result = await ctx.runQuery(api.resource.resourceFilesGetQuery, {
          token,
          resourceId,
          updatedAt,
          paginationOpts,
        })
        return mcpToolResult(result, !result.success)
      },
    },
    {
      name: "api-key-list",
      description: "List your API keys. Credentials are masked; plaintext keys are never returned by this tool.",
      inputSchema: mcpInputSchema20,
      run: async (toolArgs: a.InferInput<typeof mcpInputSchema20>) => {
        const { paginationOpts } = toolArgs

        const result = await ctx.runQuery(api.auth.apiKeyListQuery, {
          token,
          paginationOpts: paginationOpts ?? { numItems: 20, cursor: null },
        })
        return mcpToolResult(result, !result.success)
      },
    },
  ]
}
