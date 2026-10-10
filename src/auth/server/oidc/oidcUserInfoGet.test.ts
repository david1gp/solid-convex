import { expect, test } from "bun:test"
import type { OidcDiscovery } from "#src/auth/server/oidc/oidcDiscoverySchema.ts"
import type { OidcIdTokenClaims } from "#src/auth/server/oidc/oidcIdTokenClaimsSchema.ts"
import { oidcTrustedProfileCreate } from "#src/auth/server/oidc/oidcTrustedProfileCreate.ts"
import { oidcUserInfoGet } from "#src/auth/server/oidc/oidcUserInfoGet.ts"
import { oidcZitadelRoleGet } from "#src/auth/server/oidc/oidcZitadelRoleGet.ts"
import { getUserNameFromCommonAuthProvider } from "#src/auth/server/social_identity_providers/CommonAuthProvider.ts"

const discovery: OidcDiscovery & { userinfo_endpoint: string } = {
  issuer: "https://issuer.example.test",
  authorization_endpoint: "https://issuer.example.test/authorize",
  token_endpoint: "https://issuer.example.test/token",
  jwks_uri: "https://issuer.example.test/jwks",
  userinfo_endpoint: "https://issuer.example.test/userinfo",
  response_types_supported: ["code"],
  id_token_signing_alg_values_supported: ["RS256"],
}

test("UserInfo fills a missing name without replacing existing picture", async () => {
  const result = await userInfoFetch({
    needsName: true,
    needsPicture: false,
    response: { sub: "subject-123", name: "Ada Lovelace", picture: "userinfo-picture" },
  })

  expect(result).toEqual({ success: true, data: { name: "Ada Lovelace" } })
})

test("UserInfo fills a missing picture without replacing existing name", async () => {
  const result = await userInfoFetch({
    needsName: false,
    needsPicture: true,
    response: { sub: "subject-123", name: "userinfo-name", picture: "https://example.test/avatar.png" },
  })

  expect(result).toEqual({ success: true, data: { picture: "https://example.test/avatar.png" } })
})

test("blank ID-token name and picture are filled from matching UserInfo", async () => {
  const result = await userInfoFetch({
    needsName: true,
    needsPicture: true,
    response: { sub: "subject-123", name: "Ada", picture: "avatar" },
  })

  expect(result).toEqual({ success: true, data: { name: "Ada", picture: "avatar" } })
})

test("UserInfo with a different subject is rejected", async () => {
  const result = await userInfoFetch({
    needsName: true,
    needsPicture: true,
    response: { sub: "other-subject", name: "Untrusted", picture: "untrusted" },
  })

  expect(result).toEqual({ success: true, data: undefined })
})

test("UserInfo is not fetched when ID-token profile fields are complete", async () => {
  let fetchCount = 0
  const previousFetch = globalThis.fetch
  globalThis.fetch = Object.assign(
    async () => {
      fetchCount += 1
      return Response.json({ sub: "subject-123" })
    },
    { preconnect: previousFetch.preconnect },
  )
  try {
    const result = await oidcUserInfoGet({
      discovery,
      accessToken: "provider-access-token",
      subject: "subject-123",
      needsName: false,
      needsPicture: false,
    })
    expect(fetchCount).toBe(0)
    expect(result).toEqual({ success: true, data: undefined })
  } finally {
    globalThis.fetch = previousFetch
  }
})

test("UserInfo enrichment preserves verified ID-token email and roles only", async () => {
  const claims = {
    iss: discovery.issuer,
    sub: "subject-123",
    aud: "client-id",
    exp: 2,
    iat: 1,
    nonce: "nonce",
    given_name: " ",
    picture: "",
    email: "verified@example.test",
    email_verified: true,
    "urn:zitadel:iam:org:project:roles": [{ admin: { "org-123": "" } }],
  } satisfies OidcIdTokenClaims
  const profile = await userInfoFetch({
    needsName: true,
    needsPicture: true,
    response: {
      sub: "subject-123",
      name: "UserInfo Name",
      picture: "userinfo-picture",
      email: "attacker@example.test",
      roles: ["user"],
      arbitrary_claim: "ignored",
    },
  })

  expect(profile.success).toBe(true)
  if (!profile.success) return
  expect(
    oidcTrustedProfileCreate(
      claims,
      oidcZitadelRoleGet(claims["urn:zitadel:iam:org:project:roles"], "org-123"),
      profile.data,
    ),
  ).toEqual({
    provider: "oidc",
    issuer: discovery.issuer,
    providerId: "subject-123",
    givenName: "UserInfo Name",
    familyName: "",
    image: "userinfo-picture",
    username: "",
    email: "verified@example.test",
    role: "admin",
  })
})

test("a full UserInfo name does not duplicate an ID-token family name", () => {
  const profile = oidcTrustedProfileCreate(
    {
      iss: discovery.issuer,
      sub: "subject-123",
      aud: "client-id",
      exp: 2,
      iat: 1,
      nonce: "nonce",
      family_name: "Lovelace",
    },
    undefined,
    { name: "Ada Lovelace" },
  )

  expect(getUserNameFromCommonAuthProvider(profile, "New User")).toBe("Ada Lovelace")
})

async function userInfoFetch(input: { needsName: boolean; needsPicture: boolean; response: Record<string, unknown> }) {
  const previousFetch = globalThis.fetch
  globalThis.fetch = Object.assign(
    async (url: RequestInfo | URL, init?: RequestInit) => {
      expect(String(url)).toBe(discovery.userinfo_endpoint)
      expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer provider-access-token")
      return Response.json(input.response)
    },
    { preconnect: previousFetch.preconnect },
  )
  try {
    return await oidcUserInfoGet({
      discovery,
      accessToken: "provider-access-token",
      subject: "subject-123",
      needsName: input.needsName,
      needsPicture: input.needsPicture,
    })
  } finally {
    globalThis.fetch = previousFetch
  }
}
