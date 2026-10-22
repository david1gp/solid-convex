import * as a from "valibot"
import { createResult, createResultError, type PromiseResult } from "#result"
import { envGithubClientSecretResult } from "#src/app/env/private/envGithubClientSecretResult.ts"
import { envGithubClientIdResult } from "#src/app/env/public/envGithubClientIdResult.ts"
import { socialLoginProvider } from "#src/auth/model_field/socialLoginProvider.ts"
import { queryString } from "#utils/url/queryString.js"
import { searchParamsToObject } from "#utils/url/searchParamsToObject.js"
import { authErrorMessages } from "./authErrorMessages.js"

export const githubOauthTokenRootUrl = "https://github.com/login/oauth/access_token"

/**
 * https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
 * https://github.com/nextauthjs/next-auth/blob/main/packages/core/src/providers/github.ts
 * https://github.com/pilcrowOnPaper/arctic/blob/main/src/providers/github.ts
 */
export async function githubOathTokenGet(code: string): PromiseResult<GitHubOauthToken> {
  const op = "githubOathTokenGet"
  const provider = socialLoginProvider.github

  const clientSecretResult = envGithubClientSecretResult()
  if (!clientSecretResult.success) return clientSecretResult
  const clientSecret = clientSecretResult.data

  const clientIdResult = envGithubClientIdResult()
  if (!clientIdResult.success) return clientIdResult
  const clientId = clientIdResult.data

  const options = {
    client_id: clientId,
    client_secret: clientSecret,
    // redirect_uri: urlApiOauth(socialLoginProvider.github),
    code,
  }
  const r = await fetch(`${githubOauthTokenRootUrl}?${queryString(options)}`, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  })
  const text = await r.text()
  if (!r.ok) {
    const errorMessage = authErrorMessages.tokenFailedToFetchStatus(provider, r.status, text)
    return createResultError(op, errorMessage)
  }
  const json = searchParamsToObject(text)
  const result = a.safeParse(githubSchema, json)
  if (!result.success) {
    const errorMessage = authErrorMessages.tokenFailedToParse(provider, result.issues, text)
    return createResultError(op, errorMessage, text)
  }
  return createResult({ access_token: result.output.access_token })
}

const githubSchema = a.object({
  access_token: a.string(),
})

export type GitHubOauthToken = a.InferOutput<typeof githubSchema>
