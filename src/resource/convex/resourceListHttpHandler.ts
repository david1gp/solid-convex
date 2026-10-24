import * as a from "valibot"
import { internal } from "#convex/_generated/api.js"
import type { ActionCtx } from "#convex/_generated/server.js"
import { apiError } from "#src/api/apiError.ts"
import type { Language } from "#src/app/i18n/language.ts"
import { languageParseString } from "#src/app/i18n/language.ts"
import { resourceTypeSchema } from "#src/resource/model_field/resourceType.ts"
import { visibility, visibilitySchema } from "#src/resource/model_field/visibility.ts"
import { paginationDefaultOptions } from "#src/utils/convex_backend/paginationDefaultOptions.ts"
import { jsonStringifyPretty } from "#utils/json/jsonStringifyPretty.js"

export const apiBaseResource = "/api/resource"
export const apiPathResourceList = "/list"

export async function resourceListHttpHandler(ctx: ActionCtx, request: Request): Promise<Response> {
  const op = "resourceListRequestHandler"
  const url = new URL(request.url)

  const orgHandle = url.searchParams.get("orgHandle")
  const meetingId = url.searchParams.get("meetingId")
  const lRaw = url.searchParams.get("l")
  const l: Language | undefined = lRaw ? languageParseString(lRaw, undefined) : undefined
  const typeResult = parseOptionalEnum(url.searchParams.get("type"), resourceTypeSchema)
  if (!typeResult.success) return badRequest(op, typeResult.errorMessage)

  const visibilityResult = parseOptionalEnum(url.searchParams.get("visibility"), visibilitySchema)
  if (!visibilityResult.success) return badRequest(op, visibilityResult.errorMessage)
  if (visibilityResult.data && visibilityResult.data !== visibility.public) {
    return badRequest(op, "Only public resources can be requested")
  }

  const numItemsResult = parseNumItems(url.searchParams.get("numItems"))
  if (!numItemsResult.success) return badRequest(op, numItemsResult.errorMessage)
  const cursor = url.searchParams.get("cursor")

  const resources = await ctx.runQuery(internal.resource.resourcesListInternalQuery, {
    orgHandle: orgHandle || undefined,
    meetingId: meetingId || undefined,
    l,
    visibility: visibility.public,
    type: typeResult.data,
    searchText: url.searchParams.get("searchText") || undefined,
    paginationOpts: {
      cursor: cursor || paginationDefaultOptions.cursor,
      numItems: numItemsResult.data,
    },
  })

  return new Response(jsonStringifyPretty(resources), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  })
}

function parseOptionalEnum<T extends a.GenericSchema>(raw: string | null, schema: T) {
  if (!raw) return { success: true as const, data: undefined as a.InferOutput<T> | undefined }
  const parsed = a.safeParse(schema, raw)
  if (!parsed.success) return { success: false as const, errorMessage: a.summarize(parsed.issues) }
  return { success: true as const, data: parsed.output as a.InferOutput<T> }
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
  return apiError.response("resource.bad-request", op, errorMessage)
}
