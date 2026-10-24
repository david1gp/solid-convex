import { api } from "#convex/_generated/api.js"
import type { ActionCtx } from "#convex/_generated/server.js"
import { apiError } from "#src/api/apiError.ts"
import { commonApiErrorMessages } from "#src/auth/convex/sign_up/commonApiErrorMessages.ts"

export async function userDelete1RequestHandler(ctx: ActionCtx, request: Request): Promise<Response> {
  const op = "userDelete1RequestHandler"

  if (request.method !== "POST") {
    return apiError.response("auth.method-not-allowed", op, `${commonApiErrorMessages.methodNotAllowed}: expected POST`)
  }

  try {
    const body = await request.text()
    if (!body) {
      return apiError.response("auth.bad-request", op, String(commonApiErrorMessages.emptyBody))
    }

    let args: { token: string }
    try {
      const parsed = JSON.parse(body)
      args = { token: parsed.token }
    } catch {
      return apiError.response("auth.bad-request", op, "Invalid JSON body")
    }

    const result = await ctx.runMutation(api.auth.userDeleteSoftMutation, args)

    if (!result.success) {
      return apiError.fromResultError("auth.bad-request", result)
    }

    return Response.json({ success: true, data: null })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error(op, errorMessage)
    return apiError.response("auth.internal", op, errorMessage)
  }
}
