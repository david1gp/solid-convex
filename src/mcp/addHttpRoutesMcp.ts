import { addRouteWithCors } from "#src/auth/convex/headers/cors/addRouteWithCors.ts"
import type { HonoDispatcher } from "#src/auth/convex/headers/honoDispatcher.ts"
import { httpMethod } from "#src/auth/convex/headers/httpMethod.ts"
import { mcpHttpHandler } from "#src/mcp/mcpHttpHandler.ts"

export function addHttpRoutesMcp(dispatcher: HonoDispatcher) {
  addRouteWithCors(dispatcher, "/mcp", httpMethod.POST, mcpHttpHandler)
  return dispatcher
}
