import * as a from "valibot"
import { internal } from "#convex/_generated/api.js"
import type { ActionCtx } from "#convex/_generated/server.js"
import { apiError } from "#src/api/apiError.ts"
import { commonApiErrorMessages } from "#src/auth/convex/sign_up/commonApiErrorMessages.ts"
import { signUpConfirmEmailSchema } from "#src/auth/model/signUpConfirmEmailSchema.ts"
import type { UserSession } from "#src/auth/model/UserSession.ts"
import { jsonStringifyPretty } from "#utils/json/jsonStringifyPretty.js"
import { base64urlEncodeObject } from "#utils/url/base64url.js"

export async function signUpConfirmEmail1RequestHandler(ctx: ActionCtx, request: Request): Promise<Response> {
  const op = "signUpConfirmEmail1HttpHandler"

  //
  // 1. validate request
  //
  if (request.method !== "POST") {
    return apiError.response("auth.method-not-allowed", op, commonApiErrorMessages.methodNotAllowed)
  }
  const textBody = await request.text()
  if (!textBody) {
    const errorMessage = commonApiErrorMessages.emptyBody
    console.warn(op, errorMessage, textBody)
    return apiError.response("auth.bad-request", op, errorMessage)
  }
  const schema = a.pipe(a.string(), a.parseJson(), signUpConfirmEmailSchema)
  const validation = a.safeParse(schema, textBody)
  if (!validation.success) {
    const errorMessage = commonApiErrorMessages.schemaValidationFailed + ": " + a.summarize(validation.issues)
    console.warn(op, errorMessage)
    return apiError.response("auth.bad-request", op, errorMessage)
  }

  const { email, code } = validation.output

  //
  // 2. mutation: read db and validate data
  //
  const mutationResult = await ctx.runMutation(internal.auth.signUpConfirmEmail2InternalMutation, { email, code })

  if (!mutationResult.success) {
    const errorResult = mutationResult
    console.warn(errorResult)
    return apiError.fromResultError("auth.bad-request", errorResult)
  }
  const userSession: UserSession = mutationResult.data

  //
  // 3. Schedule cleanup
  //
  await ctx.scheduler.runAfter(0, internal.auth.signUpConfirmEmail3CleanupOldCodesInternalMutation, {})

  //
  // 4. Notify via Telegram
  //
  await ctx.scheduler.runAfter(0, internal.auth.notifyTelegramAuthInternalAction, {
    userSession,
    operationName: "confirm email",
  })

  //
  // 5. Return result
  //
  const userSessionSerializedResult = base64urlEncodeObject(userSession)
  if (!userSessionSerializedResult.success) {
    console.error(userSessionSerializedResult)
    return apiError.fromResultError("auth.internal", userSessionSerializedResult)
  }

  return new Response(JSON.stringify(userSession, null, 2))
}
