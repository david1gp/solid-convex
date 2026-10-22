import * as a from "valibot"
import { internal } from "#convex/_generated/api.js"
import type { ActionCtx } from "#convex/_generated/server.js"
import { createError } from "#result"
import { apiError } from "#src/api/apiError.ts"
import { envBaseUrlAppResult } from "#src/app/env/public/envBaseUrlAppResult.ts"
import { emailSignUpSend } from "#src/auth/convex/email/emailSignUpSend.ts"
import { otpCodeGenerate } from "#src/auth/convex/pw/otpCodeGenerate.ts"
import { passwordHash2 } from "#src/auth/convex/pw/passwordHash2.ts"
import { signUpErrorMessages } from "#src/auth/convex/sign_up/signUpErrorMessages.ts"
import { signUpSchema } from "#src/auth/model/signUpSchema.ts"
import { pageRouteAuth } from "#src/auth/url/pageRouteAuth.ts"
import { jsonStringifyPretty } from "#utils/json/jsonStringifyPretty.js"
import { commonApiErrorMessages } from "./commonApiErrorMessages.js"

export async function signUp1RequestHandler(ctx: ActionCtx, request: Request): Promise<Response> {
  const op = "signUp1RequestHandler"

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
  const schema = a.pipe(a.string(), a.parseJson(), signUpSchema)
  const validation = a.safeParse(schema, textBody)
  if (!validation.success) {
    const errorMessage = commonApiErrorMessages.schemaValidationFailed + ": " + a.summarize(validation.issues)
    const errorResult = createError(op, errorMessage, textBody)
    console.error(errorResult)
    return apiError.fromResultError("auth", errorResult, 400)
  }
  const { name, email, pw, l } = validation.output

  const existingUser = await ctx.runQuery(internal.auth.findUserByEmailInternalQuery, { email })
  if (existingUser) {
    if (existingUser.deletedAt) {
      const errorMessage = "An account with this email was deleted. Please contact support."
      const errorResult = createError(op, errorMessage, email)
      console.warn(errorResult)
      return apiError.fromResultError("auth", errorResult, 409)
    }
    const errorMessage = signUpErrorMessages.userAlreadyExists
    const errorResult = createError(op, errorMessage, email)
    console.warn(errorResult)
    return apiError.fromResultError("auth", errorResult, 409)
  }

  const hashedPasswordResult = await passwordHash2(pw)
  if (!hashedPasswordResult.success) {
    console.warn(hashedPasswordResult)
    return apiError.fromResultError("auth", hashedPasswordResult, 500)
  }
  const hashedPassword = hashedPasswordResult.data

  const code = otpCodeGenerate()

  // Run mutation to save code
  await ctx.runMutation(internal.auth.signUp2InternalMutation, {
    name,
    email,
    hashedPassword,
    code,
  })

  // Send email
  const hostnameAppResult = envBaseUrlAppResult()
  if (!hostnameAppResult.success) {
    console.error(hostnameAppResult)
    return apiError.fromResultError("auth", hostnameAppResult, 500)
  }
  const hostnameApp = hostnameAppResult.data
  const confirmUrl = new URL(pageRouteAuth.signUpConfirmEmail, hostnameApp)
  confirmUrl.searchParams.set("email", email)
  confirmUrl.searchParams.set("code", code)
  await emailSignUpSend(name, email, code, confirmUrl.toString(), l)

  return new Response("Sign up code sent", { status: 200 })
}
