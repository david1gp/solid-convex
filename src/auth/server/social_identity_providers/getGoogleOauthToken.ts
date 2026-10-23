import * as a from "valibot"
import { createResult, createResultError, type PromiseResult } from "#result"
import { envGoogleClientSecretResult } from "#src/app/env/private/envGoogleClientSecretResult.ts"
import { envGoogleClientIdResult } from "#src/app/env/public/envGoogleClientIdResult.ts"
import { socialLoginProvider } from "#src/auth/model_field/socialLoginProvider.ts"
import { authErrorMessages } from "#src/auth/server/social_identity_providers/authErrorMessages.ts"
import { urlAuthSignInUsingOauth } from "#src/auth/url/urlAuthSignInUsingOauth.ts"
import { queryString } from "#utils/url/queryString.js"
import { intMin1OrStringSchema } from "#utils/valibot/intOrStringSchema.js"

export const googleOAuthTokenRootUrl = "https://oauth2.googleapis.com/token"

/**
 * https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow#redirecting
 * https://github.com/nextauthjs/next-auth/blob/main/packages/core/src/providers/google.ts
 * https://github.com/pilcrowOnPaper/arctic/blob/main/src/providers/google.ts
 */
export async function getGoogleOauthToken(code: string): PromiseResult<GoogleOauthToken> {
  const op = "getGoogleOauthToken"
  const provider = socialLoginProvider.google

  const clientSecretResult = envGoogleClientSecretResult()
  if (!clientSecretResult.success) return clientSecretResult
  const clientSecret = clientSecretResult.data

  const clientIdResult = envGoogleClientIdResult()
  if (!clientIdResult.success) return clientIdResult
  const clientId = clientIdResult.data

  const options = {
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: urlAuthSignInUsingOauth(provider),
    grant_type: "authorization_code",
  }
  const r = await fetch(googleOAuthTokenRootUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: queryString(options),
  })
  const text = await r.text()
  // console.log(op, "text:", text)
  if (!r.ok) {
    const errorMessage = authErrorMessages.tokenFailedToFetchStatus(provider, r.status, text)
    return createResultError(op, errorMessage)
  }
  const result = a.safeParse(a.pipe(a.string(), a.parseJson(), googleOauthTokenSchema), text)
  if (!result.success) {
    const errorMessage = authErrorMessages.tokenFailedToParse(provider, result.issues, text)
    return createResultError(op, errorMessage, text)
  }
  return createResult(result.output)
}

export const googleOauthTokenSchema = a.object({
  access_token: a.string(),
  id_token: a.string(),
  expires_in: intMin1OrStringSchema,
  refresh_token: a.string(),
  token_type: a.string(),
  scope: a.string(),
})

export type GoogleOauthToken = a.InferOutput<typeof googleOauthTokenSchema>
