import { internal } from "#convex/_generated/api.js"
import type { ActionCtx } from "#convex/_generated/server.js"
import { apiError } from "#src/api/apiError.ts"
import { visibility } from "#src/resource/model_field/visibility.ts"
import { paginationDefaultOptions } from "#src/utils/convex_backend/paginationDefaultOptions.ts"
import { jsonStringifyPretty } from "#utils/json/jsonStringifyPretty.js"

export const apiPathResourceGet = "/get"

export async function resourceGetRequestHandler(ctx: ActionCtx, request: Request): Promise<Response> {
  const op = "resourceGetRequestHandler"
  const url = new URL(request.url)

  // Get required query parameters
  const resourceId = url.searchParams.get("resourceId")
  const numItemsResult = parseNumItems(url.searchParams.get("numItems"))
  if (!numItemsResult.success) return badRequest(op, numItemsResult.errorMessage)
  const cursor = url.searchParams.get("cursor")

  if (!resourceId) {
    return apiError.response("resource", op, "Missing required parameter: resourceId", 400)
  }

  // Get resource files using the new query
  const resourceFilesResult = await ctx.runQuery(internal.resource.resourceFilesGetInternalQuery, {
    resourceId,
    paginationOpts: {
      cursor: cursor || paginationDefaultOptions.cursor,
      numItems: numItemsResult.data,
    },
  })

  if (!resourceFilesResult.success) {
    return apiError.fromResultError("resource", resourceFilesResult, 404)
  }
  const resourceFiles = resourceFilesResult.data

  if (!resourceFiles) {
    return apiError.response("resource", op, "Resource not found", 404, { resourceId })
  }

  if (resourceFiles.resource.visibility !== visibility.public) {
    return apiError.response("resource", op, "Resource is not public", 403, { resourceId })
  }

  return new Response(jsonStringifyPretty(resourceFiles), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  })
}

function parseNumItems(raw: string | null) {
  if (!raw) return { success: true as const, data: paginationDefaultOptions.numItems }
  const numItems = Number(raw)
  if (!Number.isInteger(numItems) || numItems < 1) {
    return { success: false as const, errorMessage: "numItems must be a positive integer" }
  }
  return { success: true as const, data: numItems }
}

function badRequest(op: string, errorMessage: string) {
  return apiError.response("resource", op, errorMessage, 400)
}
