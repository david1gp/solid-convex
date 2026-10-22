import * as a from "valibot"
import { internal } from "#convex/_generated/api.js"
import type { ActionCtx } from "#convex/_generated/server.js"
import { createError } from "#result"
import { apiError } from "#src/api/apiError.ts"
import { commonApiErrorMessages } from "#src/auth/convex/sign_up/commonApiErrorMessages.ts"
import { signInViaEmailEnterOtpSchema } from "#src/auth/model/signInSchema.ts"
import type { UserSession } from "#src/auth/model/UserSession.ts"
import { jsonStringifyPretty } from "#utils/json/jsonStringifyPretty.js"
import { base64urlEncodeObject } from "#utils/url/base64url.js"

export async function signInViaEmailEnterOtp1RequestHandler(ctx: ActionCtx, request: Request): Promise<Response> {
  const op = "signInViaEmailEnterOtp1RequestHandler"

  //
  // 1. validate request
  //
  if (request.method !== "POST") {
    return apiError.response("auth", op, commonApiErrorMessages.methodNotAllowed, 400)
  }

  const textBody = await request.text()
  if (!textBody) {
    const errorMessage = commonApiErrorMessages.emptyBody
    const errorResult = createError(op, errorMessage, textBody)
    console.error(errorResult)
    return apiError.fromResultError("auth", errorResult, 400)
  }
  const schema = a.pipe(a.string(), a.parseJson(), signInViaEmailEnterOtpSchema)
  const validation = a.safeParse(schema, textBody)
  if (!validation.success) {
    const errorMessage = commonApiErrorMessages.schemaValidationFailed + ": " + a.summarize(validation.issues)
    const errorResult = createError(op, errorMessage, textBody)
    console.error(errorResult)
    return apiError.fromResultError("auth", errorResult, 400)
  }

  const { email, code } = validation.output

  //
  // 2. mutation: read db and validate data
  //
  const mutationResult = await ctx.runMutation(internal.auth.signInViaEmailEnterOtp2InternalMutation, { email, code })

  if (!mutationResult.success) {
    const errorResult = mutationResult
    console.warn(errorResult)
    return apiError.fromResultError("auth", errorResult, 400)
  }
  const userSession: UserSession = mutationResult.data

  //
  // 3. Schedule cleanup
  //
  await ctx.scheduler.runAfter(0, internal.auth.signInViaEmailEnterOtp3CleanupOldCodesInternalMutation, {})

  //
  // 4. Return result
  //
  const userSessionSerializedResult = base64urlEncodeObject(userSession)
  if (!userSessionSerializedResult.success) {
    console.error(op, userSessionSerializedResult.errorMessage)
    return apiError.fromResultError("auth", userSessionSerializedResult, 400)
  }

  return new Response(jsonStringifyPretty(userSession))
}
