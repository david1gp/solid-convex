import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
import type { ActionCtx } from "#convex/_generated/server.js"
import { authorizationHeaderGetToken } from "#src/auth/server/authorizationHeaderGetToken.ts"
import { mcpReadToolsRegister } from "#src/mcp/mcpReadToolsRegister.ts"
import { mcpWriteToolsRegister } from "#src/mcp/mcpWriteToolsRegister.ts"
import { authActionCredentialResolve } from "#src/utils/convex_backend/authActionCredentialResolve.ts"

function createMcpServer(ctx: ActionCtx, userId: string, token: string): McpServer {
  const context = { userId }
  const server = new McpServer({ name: "solid-convex", version: "1.0.0" })

  server.registerTool("ping", { description: "Check that the MCP server is reachable." }, async () => ({
    content: [{ type: "text", text: "pong" }],
  }))

  server.registerTool("server-info", { description: "Get MCP server information." }, async () => ({
    content: [
      {
        type: "text",
        text: JSON.stringify({ name: "solid-convex", version: "1.0.0", authenticated: Boolean(context.userId) }),
      },
    ],
  }))

  mcpReadToolsRegister(server, ctx, token)
  mcpWriteToolsRegister(server, ctx, token)

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
