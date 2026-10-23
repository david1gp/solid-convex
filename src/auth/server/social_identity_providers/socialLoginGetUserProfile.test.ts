import { expect, test } from "bun:test"
import { githubOauthTokenRootUrl } from "#src/auth/server/social_identity_providers/githubOathTokenGet.ts"
import { githubOauthUserProfileRootUrl } from "#src/auth/server/social_identity_providers/getGithubUserProfile.ts"
import { googleOAuthTokenRootUrl } from "#src/auth/server/social_identity_providers/getGoogleOauthToken.ts"
import {
  getGoogleUserProfile,
  googleOauthUserProfileRootUrl,
} from "#src/auth/server/social_identity_providers/getGoogleUserProfile.ts"
import { microsoftOauthTokenRootUrl } from "#src/auth/server/social_identity_providers/getMicrosoftOauthToken.ts"
import { microsoftOauthUserProfileRootUrl } from "#src/auth/server/social_identity_providers/getMicrosoftUserProfile.ts"
import { socialLoginGetUserProfile } from "#src/auth/server/social_identity_providers/socialLoginGetUserProfile.ts"

test("the admin social provider omits its unavailable email and keeps the user role path separate", async () => {
  const result = await socialLoginGetUserProfile.admin("admin-user")

  expect(result.success).toBe(true)
  if (result.success) {
    expect(result.data).not.toHaveProperty("email")
    expect(result.data.provider).toBe("admin")
  }
})

test("Google profile uses only an Authorization header for its access token", async () => {
  const result = await withFetch(
    async (input, init) => {
      expect(String(input)).toBe(googleOauthUserProfileRootUrl)
      expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer access-secret")
      return Response.json({
        id: "google-user",
        email: "user@example.test",
        verified_email: true,
        name: "Google User",
        given_name: "Google",
        picture: "",
      })
    },
    () => getGoogleUserProfile({ id_token: "id-secret", access_token: "access-secret" }),
  )

  expect(result.success).toBe(true)
})

test("Google does not provide an unverified email for account linking", async () => {
  await withEnvironment(
    {
      GOOGLE_CLIENT_SECRET: "google-secret",
      PUBLIC_GOOGLE_CLIENT_ID: "google-client",
      PUBLIC_BASE_URL_API: "https://api.example.test",
    },
    async () => {
      const result = await withFetch(
        async (input) => {
          if (String(input) === googleOAuthTokenRootUrl)
            return Response.json({
              access_token: "google-secret",
              id_token: "id-token",
              expires_in: 3600,
              refresh_token: "refresh-secret",
              token_type: "Bearer",
              scope: "openid profile email",
            })
          if (String(input) === googleOauthUserProfileRootUrl)
            return Response.json({
              id: "google-user",
              email: "unverified@example.test",
              verified_email: false,
              name: "Google User",
              given_name: "Google",
              picture: "",
            })
          return new Response("not found", { status: 404 })
        },
        () => socialLoginGetUserProfile.google("authorization-code"),
      )
      expect(result.success).toBe(true)
      if (result.success) expect(result.data).not.toHaveProperty("email")
    },
  )
})

test("GitHub and Microsoft omit profiles without an email", async () => {
  await withEnvironment(
    {
      GITHUB_CLIENT_SECRET: "github-secret",
      PUBLIC_GITHUB_CLIENT_ID: "github-client",
      MICROSOFT_CLIENT_SECRET: "microsoft-secret",
      PUBLIC_MICROSOFT_CLIENT_ID: "microsoft-client",
      PUBLIC_BASE_URL_API: "https://api.example.test",
    },
    async () => {
      const result = await withFetch(
        async (input) => {
          const url = String(input)
          if (url.startsWith(githubOauthTokenRootUrl)) return new Response("access_token=github-token")
          if (url === githubOauthUserProfileRootUrl) {
            return Response.json({
              login: "github-user",
              id: 123,
              avatar_url: "",
              name: "GitHub User",
              email: null,
              created_at: "2026-09-18T00:00:00.000Z",
              updated_at: "2026-09-18T00:00:00.000Z",
            })
          }
          if (url === microsoftOauthTokenRootUrl) return new Response("access_token=microsoft-token")
          if (url === microsoftOauthUserProfileRootUrl) {
            return Response.json({
              id: "microsoft-user",
              displayName: "Microsoft User",
              givenName: "Microsoft",
              surname: "User",
              mail: null,
              userPrincipalName: "microsoft-user@example.test",
            })
          }
          return new Response("not found", { status: 404 })
        },
        async () => {
          const githubResult = await socialLoginGetUserProfile.github("github-code")
          const microsoftResult = await socialLoginGetUserProfile.microsoft("microsoft-code")
          return { githubResult, microsoftResult }
        },
      )

      expect(result.githubResult.success).toBe(true)
      expect(result.microsoftResult.success).toBe(true)
      if (result.githubResult.success) expect(result.githubResult.data).not.toHaveProperty("email")
      if (result.microsoftResult.success) expect(result.microsoftResult.data).not.toHaveProperty("email")
    },
  )
})

async function withFetch<T>(
  implementation: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
  callback: () => Promise<T>,
) {
  const previous = globalThis.fetch
  globalThis.fetch = Object.assign(implementation, { preconnect: previous.preconnect })
  try {
    return await callback()
  } finally {
    globalThis.fetch = previous
  }
}

async function withEnvironment<T>(values: Record<string, string>, callback: () => Promise<T>): Promise<T> {
  const previousValues = new Map<string, string | undefined>()
  for (const [name, value] of Object.entries(values)) {
    previousValues.set(name, process.env[name])
    process.env[name] = value
  }
  try {
    return await callback()
  } finally {
    for (const [name, value] of previousValues) {
      if (value === undefined) delete process.env[name]
      else process.env[name] = value
    }
  }
}
