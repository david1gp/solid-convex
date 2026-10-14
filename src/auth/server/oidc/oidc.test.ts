import { expect, test } from "bun:test"
import { exportJWK, generateKeyPair, SignJWT } from "jose"
import { oidcAuthorizationUrlCreate } from "#src/auth/server/oidc/oidcAuthorizationUrlCreate.ts"
import type { OidcConfig } from "#src/auth/server/oidc/oidcConfig.ts"
import { oidcConfigGet } from "#src/auth/server/oidc/oidcConfigGet.ts"
import { oidcDiscoveryGet } from "#src/auth/server/oidc/oidcDiscoveryGet.ts"
import type { OidcDiscovery } from "#src/auth/server/oidc/oidcDiscoverySchema.ts"
import { oidcIdTokenVerify } from "#src/auth/server/oidc/oidcIdTokenVerify.ts"
import { oidcTokenExchange } from "#src/auth/server/oidc/oidcTokenExchange.ts"
import { oidcTransactionCookie } from "#src/auth/server/oidc/oidcTransactionCookie.ts"

const oidcConfig: OidcConfig = {
  issuer: "https://issuer.example",
  clientId: "client-id",
  scopes: ["openid", "profile", "email"],
}

const oidcDiscovery: OidcDiscovery = {
  issuer: oidcConfig.issuer,
  authorization_endpoint: "https://issuer.example/authorize",
  token_endpoint: "https://issuer.example/token",
  jwks_uri: "https://issuer.example/jwks",
  response_types_supported: ["code"],
  id_token_signing_alg_values_supported: ["RS256"],
  token_endpoint_auth_methods_supported: ["none"],
}

test("oidcConfigGet reads server-only OIDC settings and defaults scopes", async () => {
  await withEnvironment(
    {
      OIDC_ISSUER: "https://issuer.example",
      OIDC_CLIENT_ID: "client-id",
      OIDC_CLIENT_SECRET: undefined,
      OIDC_SCOPES: undefined,
      OIDC_ZITADEL_ORG_ID: undefined,
      ZITADEL_PROJECT_ID: undefined,
    },
    async () => {
      const result = oidcConfigGet()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({
          issuer: "https://issuer.example",
          clientId: "client-id",
          clientSecret: undefined,
          scopes: ["openid", "profile", "email"],
        })
      }
    },
  )

  await withEnvironment(
    {
      OIDC_ISSUER: "https://issuer.example",
      OIDC_CLIENT_ID: "client-id",
      OIDC_CLIENT_SECRET: undefined,
      OIDC_SCOPES: "openid profile email",
      OIDC_ZITADEL_ORG_ID: "380716752838852623",
      ZITADEL_PROJECT_ID: undefined,
    },
    async () => {
      const result = oidcConfigGet()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.scopes).toEqual([
          "openid",
          "profile",
          "email",
          "urn:zitadel:iam:org:project:roles",
          "urn:zitadel:iam:org:project:role:user",
          "urn:zitadel:iam:org:project:role:member",
          "urn:zitadel:iam:org:project:role:admin",
        ])
      }
    },
  )

  await withEnvironment(
    {
      OIDC_ISSUER: "https://issuer.example",
      OIDC_CLIENT_ID: "client-id",
      OIDC_CLIENT_SECRET: undefined,
      OIDC_SCOPES: "openid profile custom-scope urn:zitadel:iam:org:project:role:user openid",
      OIDC_ZITADEL_ORG_ID: "380716752838852623",
      ZITADEL_PROJECT_ID: "394198525392453636",
    },
    async () => {
      const result = oidcConfigGet()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.zitadelOrgId).toBe("380716752838852623")
        expect(result.data.scopes).toEqual([
          "openid",
          "profile",
          "custom-scope",
          "urn:zitadel:iam:org:project:role:user",
          "urn:zitadel:iam:org:project:roles",
          "urn:zitadel:iam:org:project:role:member",
          "urn:zitadel:iam:org:project:role:admin",
          "urn:zitadel:iam:org:project:id:394198525392453636:roles",
        ])
      }
    },
  )

  await withEnvironment(
    {
      OIDC_ISSUER: "https://issuer.example",
      OIDC_CLIENT_ID: "client-id",
      OIDC_SCOPES: "profile email",
      OIDC_ZITADEL_ORG_ID: undefined,
    },
    async () => {
      expect(oidcConfigGet().success).toBe(false)
    },
  )

  await withEnvironment(
    {
      OIDC_ISSUER: "https://issuer.example",
      OIDC_CLIENT_ID: "client-id",
      OIDC_ZITADEL_ORG_ID: "380716752838852623",
    },
    async () => {
      const result = oidcConfigGet()
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.scopes).toContain("urn:zitadel:iam:org:project:role:member")
        expect(result.data.scopes).toContain("urn:zitadel:iam:org:project:role:user")
        expect(result.data.scopes).toContain("urn:zitadel:iam:org:project:role:admin")
      }
    },
  )
})

test("oidcDiscoveryGet validates issuer, flow, algorithms, and HTTPS endpoints", async () => {
  const discoveryResult = await withFetch(
    async (input) => {
      expect(String(input)).toBe("https://issuer.example/.well-known/openid-configuration")
      return new Response(JSON.stringify(oidcDiscovery), { headers: { "Content-Type": "application/json" } })
    },
    () => oidcDiscoveryGet(oidcConfig),
  )
  expect(discoveryResult.success).toBe(true)

  const invalidDiscovery = { ...oidcDiscovery, issuer: "https://other.example" }
  const invalidResult = await withFetch(
    async () => new Response(JSON.stringify(invalidDiscovery)),
    () => oidcDiscoveryGet(oidcConfig),
  )
  expect(invalidResult.success).toBe(false)
})

test("oidcAuthorizationUrlCreate includes state nonce and S256 PKCE", async () => {
  const result = await oidcAuthorizationUrlCreate({
    config: oidcConfig,
    discovery: oidcDiscovery,
    redirectUri: "https://app.example/auth/oidc/callback",
    state: "state-value",
    nonce: "nonce-value",
    codeVerifier: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.~",
  })

  expect(result.success).toBe(true)
  if (result.success) {
    const url = new URL(result.data)
    expect(url.searchParams.get("client_id")).toBe("client-id")
    expect(url.searchParams.get("response_type")).toBe("code")
    expect(url.searchParams.get("scope")).toBe("openid profile email")
    expect(url.searchParams.get("state")).toBe("state-value")
    expect(url.searchParams.get("nonce")).toBe("nonce-value")
    expect(url.searchParams.get("code_challenge_method")).toBe("S256")
    expect(url.searchParams.get("code_challenge")).toMatch(/^[A-Za-z0-9_-]{43}$/u)
  }

  const invalidResult = await oidcAuthorizationUrlCreate({
    config: oidcConfig,
    discovery: oidcDiscovery,
    redirectUri: "https://app.example/auth/oidc/callback",
    state: "",
    nonce: "nonce-value",
    codeVerifier: "short",
  })
  expect(invalidResult.success).toBe(false)
})

test("oidcTokenExchange supports public PKCE and confidential basic clients", async () => {
  let publicRequest: RequestInit | undefined
  const publicResult = await withFetch(
    async (_input, init) => {
      publicRequest = init
      return new Response(JSON.stringify({ id_token: "public-id-token" }))
    },
    () =>
      oidcTokenExchange({
        config: oidcConfig,
        discovery: oidcDiscovery,
        code: "authorization-code",
        codeVerifier: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.~",
        redirectUri: "https://app.example/auth/oidc/callback",
      }),
  )
  expect(publicResult.success).toBe(true)
  const publicBody = new URLSearchParams(String(publicRequest?.body))
  expect(publicBody.get("client_id")).toBe("client-id")
  expect(publicBody.get("client_secret")).toBeNull()
  expect(new Headers(publicRequest?.headers).get("Accept")).toBe("application/json")

  let confidentialRequest: RequestInit | undefined
  const confidentialResult = await withFetch(
    async (_input, init) => {
      confidentialRequest = init
      return new Response(JSON.stringify({ id_token: "confidential-id-token" }))
    },
    () =>
      oidcTokenExchange({
        config: { ...oidcConfig, clientSecret: "client-secret" },
        discovery: {
          ...oidcDiscovery,
          token_endpoint_auth_methods_supported: ["client_secret_basic", "client_secret_post"],
        },
        code: "authorization-code",
        codeVerifier: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.~",
        redirectUri: "https://app.example/auth/oidc/callback",
      }),
  )
  expect(confidentialResult.success).toBe(true)
  expect(new Headers(confidentialRequest?.headers).get("Authorization")).toMatch(/^Basic /u)
  expect(new URLSearchParams(String(confidentialRequest?.body)).get("client_secret")).toBeNull()

  const unsupportedResult = await oidcTokenExchange({
    config: oidcConfig,
    discovery: { ...oidcDiscovery, token_endpoint_auth_methods_supported: ["client_secret_basic"] },
    code: "authorization-code",
    codeVerifier: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.~",
    redirectUri: "https://app.example/auth/oidc/callback",
  })
  expect(unsupportedResult.success).toBe(false)
})

test("oidcIdTokenVerify validates a signed ID token with discovered JWKS", async () => {
  const { publicKey, privateKey } = await generateKeyPair("RS256")
  const jwk = await exportJWK(publicKey)
  const currentDate = new Date("2026-09-14T00:00:00.000Z")
  const nowSeconds = Math.floor(currentDate.getTime() / 1000)
  const idToken = await new SignJWT({
    nonce: "nonce-value",
    email: "user@example.com",
    email_verified: true,
    "urn:zitadel:iam:org:project:roles": [{ admin: { "380716752838852623": "contentoren.example" } }],
  })
    .setProtectedHeader({ alg: "RS256", kid: "test-key" })
    .setIssuer(oidcConfig.issuer)
    .setSubject("subject-1")
    .setAudience(oidcConfig.clientId)
    .setIssuedAt(nowSeconds)
    .setExpirationTime(nowSeconds + 300)
    .sign(privateKey)
  const discovery = { ...oidcDiscovery, token_endpoint_auth_methods_supported: undefined }
  const fetchJwks = async () =>
    new Response(JSON.stringify({ keys: [{ ...jwk, kid: "test-key", alg: "RS256", use: "sig" }] }))

  const result = await withFetch(fetchJwks, () =>
    oidcIdTokenVerify({ config: oidcConfig, discovery, idToken, nonce: "nonce-value", currentDate }),
  )
  expect(result.success).toBe(true)
  if (result.success) {
    expect(result.data.iss).toBe(oidcConfig.issuer)
    expect(result.data.sub).toBe("subject-1")
    expect(result.data.email).toBe("user@example.com")
    expect(result.data["urn:zitadel:iam:org:project:roles"]).toEqual([
      { admin: { "380716752838852623": "contentoren.example" } },
    ])
  }

  const nonceFailure = await withFetch(fetchJwks, () =>
    oidcIdTokenVerify({ config: oidcConfig, discovery, idToken, nonce: "different-nonce", currentDate }),
  )
  expect(nonceFailure.success).toBe(false)

  const tokenParts = idToken.split(".")
  const tamperedSignature = `${tokenParts[2]?.startsWith("a") ? "b" : "a"}${tokenParts[2]?.slice(1)}`
  const tamperedToken = `${tokenParts[0]}.${tokenParts[1]}.${tamperedSignature}`
  const signatureFailure = await withFetch(fetchJwks, () =>
    oidcIdTokenVerify({ config: oidcConfig, discovery, idToken: tamperedToken, nonce: "nonce-value", currentDate }),
  )
  expect(signatureFailure.success).toBe(false)
})

test("oidcTransactionCookie signs transactions and rejects tampering or state mismatch", async () => {
  await withEnvironment({ AUTH_SECRET: "test-auth-secret" }, async () => {
    const created = await oidcTransactionCookie.createHeaders("/after-sign-in?tab=home")
    expect(created.success).toBe(true)
    if (!created.success) return

    const setCookie = created.data.headers.get("Set-Cookie") ?? ""
    expect(setCookie).toContain("__Host-oidc-transaction=")
    expect(setCookie).toContain("HttpOnly")
    expect(setCookie).toContain("SameSite=Lax")
    expect(setCookie).toContain("Secure")
    const cookie = setCookie.split(";", 1)[0] ?? ""
    const request = new Request("https://app.example/auth/oidc/callback", { headers: { cookie } })
    const read = await oidcTransactionCookie.readHeaders(request, created.data.transaction.state)
    expect(read.success).toBe(true)
    if (read.success) expect(read.data.returnTo).toBe("/after-sign-in?tab=home")

    const [cookiePrefix, cookieValue = ""] = cookie.split("=", 2)
    const [encodedPayload, signature = ""] = cookieValue.split(".", 2)
    const tamperedSignature = `${signature.startsWith("A") ? "B" : "A"}${signature.slice(1)}`
    const tamperedCookie = `${cookiePrefix}=${encodedPayload}.${tamperedSignature}`
    const tampered = await oidcTransactionCookie.readHeaders(
      new Request(request, { headers: { cookie: tamperedCookie } }),
      created.data.transaction.state,
    )
    expect(tampered.success).toBe(false)

    const wrongState = await oidcTransactionCookie.readHeaders(request, "wrong-state")
    expect(wrongState.success).toBe(false)

    const externalReturnTo = await oidcTransactionCookie.createHeaders("https://evil.example/")
    expect(externalReturnTo.success).toBe(true)
    if (externalReturnTo.success) expect(externalReturnTo.data.transaction.returnTo).toBe("/")

    expect(oidcTransactionCookie.clearHeaders().get("Set-Cookie")).toContain("Max-Age=0")
  })
})

async function withFetch<T>(
  fetchImplementation: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
  callback: () => Promise<T>,
): Promise<T> {
  const previousFetch = globalThis.fetch
  globalThis.fetch = fetchImplementation as typeof fetch
  try {
    return await callback()
  } finally {
    globalThis.fetch = previousFetch
  }
}

async function withEnvironment<T>(values: Record<string, string | undefined>, callback: () => Promise<T>): Promise<T> {
  const previousValues = new Map<string, string | undefined>()
  for (const [name, value] of Object.entries(values)) {
    previousValues.set(name, process.env[name])
    if (value === undefined) delete process.env[name]
    else process.env[name] = value
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
