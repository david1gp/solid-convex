import * as a from "valibot"
import { createResult, createResultError, type PromiseResult } from "#result"
import { loginProvider } from "#src/auth/model_field/socialLoginProvider.ts"
import { authErrorMessages } from "#src/auth/server/social_identity_providers/authErrorMessages.ts"
import { intOrStringSchema } from "#utils/valibot/intOrStringSchema.js"

/**
 * https://docs.github.com/en/rest/users/users#get-the-authenticated-user
 * https://github.com/nextauthjs/next-auth/blob/main/packages/core/src/providers/github.ts
 */
export const githubOauthUserProfileRootUrl = "https://api.github.com/user"

export type GitHubUserProfile = Omit<a.InferOutput<typeof githubProfileSchema>, "created_at" | "updated_at"> & {
  created_at: string
  updated_at: string
}

export async function getGithubUserProfile(access_token: string): PromiseResult<GitHubUserProfile> {
  const op = "getGithubUserProfile"
  const provider = loginProvider.github
  const r = await fetch(githubOauthUserProfileRootUrl, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  })
  const text = await r.text()
  if (!r.ok) {
    const errorMessage = authErrorMessages.profileFailedToFetchStatus(provider, r.status, text)
    return createResultError(op, errorMessage)
  }
  const result = a.safeParse(a.pipe(a.string(), a.parseJson(), githubProfileSchema), text)
  if (!result.success) {
    const errorMessage = authErrorMessages.profileFailedToParse(provider, result.issues, text)
    return createResultError(op, errorMessage, text)
  }
  const profile: GitHubUserProfile = {
    ...result.output,
    created_at: result.output.created_at.toISOString(),
    updated_at: result.output.updated_at.toISOString(),
  }
  return createResult(profile)
}

const githubProfileSchema = a.object({
  login: a.string(),
  id: intOrStringSchema,
  avatar_url: a.string(),
  name: a.string(),
  email: a.nullable(a.string()),
  created_at: a.pipe(
    a.string(),
    a.transform((str) => new Date(str)),
  ),
  updated_at: a.pipe(
    a.string(),
    a.transform((str) => new Date(str)),
  ),
})
