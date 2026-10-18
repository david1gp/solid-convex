import * as a from "valibot"
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js"
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
import type { ActionCtx } from "#convex/_generated/server.js"
import { authorizationHeaderGetToken } from "#src/auth/server/authorizationHeaderGetToken.ts"
import { mcpReadToolDefinitions } from "#src/mcp/mcpReadToolsRegister.ts"
import { mcpWriteToolDefinitions } from "#src/mcp/mcpWriteToolsRegister.ts"
import type { McpToolDefinition } from "#src/mcp/mcpToolRegistry.ts"
import { mcpToolCall, mcpToolDefinitionsRegister } from "#src/mcp/mcpToolRegistry.ts"
import { authActionCredentialResolve } from "#src/utils/convex_backend/authActionCredentialResolve.ts"

function createMcpServer(ctx: ActionCtx, userId: string, token: string): Server {
  const definitions: McpToolDefinition[] = [
    {
      name: "ping",
      description: "Check that the MCP server is reachable.",
      inputSchema: a.object({}),
      run: async () => ({ content: [{ type: "text", text: "pong" }] }),
    },
    {
      name: "server-info",
      description: "Get MCP server information.",
      inputSchema: a.object({}),
      run: async () => ({
        content: [
          {
            type: "text",
            text: JSON.stringify({ name: "solid-convex", version: "1.0.0", authenticated: Boolean(userId) }),
          },
        ],
      }),
    },
    ...mcpReadToolDefinitions(ctx, token),
    ...mcpWriteToolDefinitions(ctx, token),
  ]
  const registered = mcpToolDefinitionsRegister(definitions)

  const server = new Server({ name: "solid-convex", version: "1.0.0" }, { capabilities: { tools: {} } })
  server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: registered.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: { type: "object" as const, ...tool.inputJsonSchema },
      execution: { taskSupport: "forbidden" as const },
    })),
  }))
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const params = (request as { params: { name: string; arguments?: unknown } }).params
    return mcpToolCall(definitions, params.name, params.arguments)
  })

  return server
}

function unauthorizedResponse(): Response {
  return Response.json({ jsonrpc: "2.0", error: { code: -32001, message: "Unauthorized" }, id: null }, { status: 401 })
}

export async function mcpHttpHandler(ctx: ActionCtx, request: Request): Promise<Response> {
  const authorization = request.headers.get("authorization")
  if (!/^Bearer\s/i.test(authorization ?? "")) return unauthorizedResponse()

  const token = authorizationHeaderGetToken(authorization)
  if (!token) return unauthorizedResponse()

  let credentialResult
  try {
    credentialResult = await authActionCredentialResolve(ctx, token)
  } catch {
    return unauthorizedResponse()
  }
  if (!credentialResult.success) return unauthorizedResponse()

  const server = createMcpServer(ctx, credentialResult.data.userId, token)
  const transport = new WebStandardStreamableHTTPServerTransport({ enableJsonResponse: true })
  await server.connect(transport)
  return transport.handleRequest(request)
}
