import { api } from "#convex/_generated/api.js"
import type { ActionCtx } from "#convex/_generated/server.js"
import * as a from "valibot"
import { addRouteWithCors } from "#src/auth/convex/headers/cors/addRouteWithCors.ts"
import type { HonoDispatcher } from "#src/auth/convex/headers/honoDispatcher.ts"
import { httpMethod } from "#src/auth/convex/headers/httpMethod.ts"
import { userEmailChange1RequestHandler } from "#src/auth/convex/user/email_change/userEmailChange1RequestHandler.ts"
import { userEmailChange2ConfirmHandler } from "#src/auth/convex/user/email_change/userEmailChange2ConfirmHandler.ts"
import { userProfileUpdate1RequestHandler } from "#src/auth/convex/user/profile_update/userProfileUpdate1RequestHandler.ts"
import { userPasswordChange1RequestHandler } from "#src/auth/convex/user/pw_change/userPasswordChange1RequestHandler.ts"
import { userPasswordChange2ConfirmHandler } from "#src/auth/convex/user/pw_change/userPasswordChange2ConfirmHandler.ts"
import { apiKeyListItemSchema } from "#src/auth/model/apiKeyListItemSchema.ts"
import { apiKeyNameSchema } from "#src/auth/model/apiKeyNameSchema.ts"
import { authorizationHeaderGetToken } from "#src/auth/server/authorizationHeaderGetToken.ts"
import { authActionCredentialResolve } from "#src/utils/convex_backend/authActionCredentialResolve.ts"

const pageSchema = a.object({
  numItems: a.pipe(a.number(), a.integer(), a.minValue(1), a.maxValue(100)),
  cursor: a.nullable(a.string()),
})
const expirySchema = a.optional(a.picklist(["never", "1-day", "1-week", "1-month", "1-year", "2-years", "3-years"]))
const keyIdSchema = a.pipe(a.string(), a.minLength(1))

function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status })
}

async function bearerRequest(ctx: ActionCtx, request: Request): Promise<{ token: string } | Response> {
  const token = authorizationHeaderGetToken(request.headers.get("authorization"))
  if (!token) return jsonError("Unauthorized", 401)
  try {
    const credential = await authActionCredentialResolve(ctx, token)
    if (!credential.success) return jsonError("Unauthorized", 401)
  } catch {
    return jsonError("Unauthorized", 401)
  }
  return { token }
}

async function bodyRead(request: Request): Promise<Record<string, unknown> | Response> {
  const value: unknown = await request.json().catch(() => null)
  if (!value || typeof value !== "object" || Array.isArray(value)) return jsonError("Invalid JSON body", 400)
  return value as Record<string, unknown>
}

function withTokenRequest(request: Request, token: string, body: Record<string, unknown>): Request {
  return new Request(request, { body: JSON.stringify({ ...body, token }), headers: request.headers })
}

export function addHttpRoutesApiKeysProfile(dispatcher: HonoDispatcher) {
  addRouteWithCors(dispatcher, "/api/keys", httpMethod.GET, async (ctx, request) => {
    const auth = await bearerRequest(ctx, request)
    if (auth instanceof Response) return auth
    const query = new URL(request.url).searchParams
    const pagination = a.safeParse(pageSchema, {
      numItems: Number(query.get("numItems") ?? 50),
      cursor: query.get("cursor"),
    })
    if (!pagination.success) return jsonError("Invalid pagination", 400)
    try {
      const result = await ctx.runQuery(api.auth.apiKeyListQuery, {
        token: auth.token,
        paginationOpts: pagination.output,
      })
      const data = result.success ? (result.data as { page?: unknown[] } | undefined) : undefined
      if (data && Array.isArray(data.page)) {
        const items = data.page.map((item: unknown) => a.safeParse(apiKeyListItemSchema, item))
        if (items.some((item) => !item.success)) return jsonError("Invalid key response", 500)
      }
      return Response.json(result)
    } catch {
      return jsonError("Request failed", 500)
    }
  })

  for (const path of ["/api/keys/create", "/api/keys/rename", "/api/keys/revoke", "/api/keys/rotate"] as const) {
    addRouteWithCors(dispatcher, path, httpMethod.POST, async (ctx, request) => {
      const auth = await bearerRequest(ctx, request)
      if (auth instanceof Response) return auth
      const body = await bodyRead(request)
      if (body instanceof Response) return body
      const name =
        path.endsWith("create") || path.endsWith("rename") ? a.safeParse(apiKeyNameSchema, body.name) : undefined
      if (name && !name.success) return jsonError("Invalid key name", 400)
      const id = path.endsWith("create") ? undefined : a.safeParse(keyIdSchema, body.id)
      if (id && !id.success) return jsonError("Invalid key id", 400)
      const expiry = path.endsWith("create") ? a.safeParse(expirySchema, body.expiryPreset) : undefined
      if (expiry && !expiry.success) return jsonError("Invalid expiry preset", 400)
      const fn = path.endsWith("create")
        ? api.auth.apiKeyCreateMutation
        : path.endsWith("rename")
          ? api.auth.apiKeyRenameMutation
          : path.endsWith("revoke")
            ? api.auth.apiKeyRevokeMutation
            : api.auth.apiKeyRotateMutation
      const args = path.endsWith("create")
        ? { token: auth.token, name: name!.output, expiryPreset: expiry!.output }
        : path.endsWith("rename")
          ? { token: auth.token, id: id!.output, name: name!.output }
          : { token: auth.token, id: id!.output }
      try {
        // Create and rotate intentionally return the credential once; callers must store it securely.
        return Response.json(await ctx.runMutation(fn, args as never))
      } catch {
        return jsonError("Request failed", 500)
      }
    })
  }

  const aliases = [
    ["/api/profile/update", userProfileUpdate1RequestHandler],
    ["/api/password/change-request", userPasswordChange1RequestHandler],
    ["/api/password/change-confirm", userPasswordChange2ConfirmHandler],
    ["/api/email/change-request", userEmailChange1RequestHandler],
    ["/api/email/change-confirm", userEmailChange2ConfirmHandler],
  ] as const
  for (const [path, handler] of aliases) {
    addRouteWithCors(dispatcher, path, httpMethod.POST, async (ctx, request) => {
      const auth = await bearerRequest(ctx, request)
      if (auth instanceof Response) return auth
      const body = await bodyRead(request)
      if (body instanceof Response) return body
      return handler(ctx, withTokenRequest(request, auth.token, body))
    })
  }
  return dispatcher
}
