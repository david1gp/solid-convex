import { expect, test } from "bun:test"
import { exportJWK, generateKeyPair, SignJWT } from "jose"
import type { MutationCtx } from "#convex/_generated/server.js"
import { addHttpRoutesAuth } from "#src/auth/convex/addHttpRoutesAuth.ts"
import { findOrCreateUserFn } from "#src/auth/convex/crud/findOrCreateUserFn.ts"
import { createHonoDispatcher } from "#src/auth/convex/headers/createHonoDispatcher.ts"
import type { UserSession } from "#src/auth/model/UserSession.ts"
import { urlSignInViaAuthworksOidc } from "#src/auth/url/urlSignInViaAuthworksOidc.ts"
import { urlSignInViaOidc } from "#src/auth/url/urlSignInViaOidc.ts"
import { base64urlDecodeObject } from "#utils/url/base64url.js"

const issuer = "https://issuer.example.test"
const clientId = "oidc-client-id"
const apiBaseUrl = "https://api.example.test"
const appBaseUrl = "https://app.example.test"
const callbackUrl = `${apiBaseUrl}/api/auth/oidc/callback`
const discovery = {
  issuer,
  authorization_endpoint: `${issuer}/authorize`,
  token_endpoint: `${issuer}/token`,
  jwks_uri: `${issuer}/jwks`,
  response_types_supported: ["code"],
  id_token_signing_alg_values_supported: ["RS256"],
  token_endpoint_auth_methods_supported: ["none"],
}

test("OIDC routes complete a verified session through Hono", async () => {
  await withEnvironment(async () => {
    const { privateKey, publicJwk } = await signingKeysCreate()
    const userSession = createUserSession()
    const mutationCalls: unknown[] = []
    const scheduledCalls: unknown[] = []
    const ctx = actionContextCreate(mutationCalls, scheduledCalls, userSession)
    let idTokenNonce = ""

    await withFetch(
      async (input, init) => {
        const request = new Request(input, init)
        if (request.url === `${issuer}/.well-known/openid-configuration`) return Response.json(discovery)
        if (request.url === discovery.token_endpoint)
          return Response.json({ id_token: await idTokenCreate(privateKey, idTokenNonce) })
        if (request.url === discovery.jwks_uri) return Response.json({ keys: [publicJwk] })
        return new Response("not found", { status: 404 })
      },
      async () => {
        const dispatcher = createHonoDispatcher()
        addHttpRoutesAuth(dispatcher)
        const startResponse = await dispatcher.fetch(new Request(urlSignInViaOidc("/groups?from=oidc#top")), ctx)
        expect(startResponse.status).toBe(302)

        const authorizationUrl = new URL(startResponse.headers.get("location") ?? "")
        expect(authorizationUrl.origin + authorizationUrl.pathname).toBe(`${issuer}/authorize`)
        expect(authorizationUrl.searchParams.get("redirect_uri")).toBe(callbackUrl)
        expect(authorizationUrl.searchParams.get("code_challenge_method")).toBe("S256")
        idTokenNonce = authorizationUrl.searchParams.get("nonce") ?? ""
        const cookie = startResponse.headers.get("set-cookie")?.split(";", 1)[0] ?? ""
        const state = authorizationUrl.searchParams.get("state") ?? ""
        const callbackResponse = await dispatcher.fetch(
          new Request(`${callbackUrl}?state=${encodeURIComponent(state)}&code=authorization-code`, {
            headers: { Cookie: cookie },
          }),
          ctx,
        )

        expect(callbackResponse.status).toBe(302)
        expect(callbackResponse.headers.get("set-cookie")).toContain("Max-Age=0")
        const location = new URL(callbackResponse.headers.get("location") ?? "")
        expect(location.origin).toBe(appBaseUrl)
        expect(location.pathname).toBe("/groups")
        expect(location.searchParams.get("from")).toBe("oidc")
        expect(location.hash).toBe("#top")
        expect(base64urlDecodeObject(location.searchParams.get("userSession") ?? "").success).toBe(true)
        expect(mutationCalls).toEqual([
          {
            provider: "oidc",
            issuer,
            providerId: "subject-123",
            givenName: "Ada",
            familyName: "User",
            image: "",
            username: "ada",
            email: "ada@example.test",
          },
        ])
        expect(scheduledCalls).toHaveLength(1)
      },
    )
  })
})

test("OIDC callback enriches blank token name and picture only from matching UserInfo", async () => {
  await withEnvironment(async () => {
    const { privateKey, publicJwk } = await signingKeysCreate()
    const mutationCalls: unknown[] = []
    const ctx = actionContextCreate(mutationCalls, [], createUserSession())
    let nonce = ""
    let userInfoCalls = 0

    await withFetch(
      async (input, init) => {
        const request = new Request(input, init)
        if (request.url === `${issuer}/.well-known/openid-configuration`)
          return Response.json({ ...discovery, userinfo_endpoint: `${issuer}/userinfo` })
        if (request.url === discovery.token_endpoint)
          return Response.json({
            id_token: await idTokenCreate(privateKey, nonce, {
              given_name: " ",
              family_name: "Lovelace",
              picture: " ",
            }),
            access_token: "provider-secret",
          })
        if (request.url === discovery.jwks_uri) return Response.json({ keys: [publicJwk] })
        if (request.url === `${issuer}/userinfo`) {
          userInfoCalls += 1
          expect(request.headers.get("Authorization")).toBe("Bearer provider-secret")
          return Response.json({
            sub: "subject-123",
            name: "Ada Lovelace",
            picture: "https://example.test/ada.png",
            email: "unverified@example.test",
            role: "admin",
          })
        }
        return new Response("not found", { status: 404 })
      },
      async () => {
        const dispatcher = createHonoDispatcher()
        addHttpRoutesAuth(dispatcher)
        const start = await dispatcher.fetch(new Request(urlSignInViaOidc("/")), ctx)
        const authorization = new URL(start.headers.get("location") ?? "")
        nonce = authorization.searchParams.get("nonce") ?? ""
        const cookie = start.headers.get("set-cookie")?.split(";", 1)[0] ?? ""
        const state = authorization.searchParams.get("state") ?? ""
        const response = await dispatcher.fetch(
          new Request(`${callbackUrl}?state=${encodeURIComponent(state)}&code=authorization-code`, {
            headers: { Cookie: cookie },
          }),
          ctx,
        )

        expect(response.status).toBe(302)
        expect(userInfoCalls).toBe(1)
        expect(mutationCalls).toEqual([
          {
            provider: "oidc",
            issuer,
            providerId: "subject-123",
            givenName: "Ada Lovelace",
            familyName: "",
            image: "https://example.test/ada.png",
            username: "ada",
            email: "ada@example.test",
          },
        ])
        expect(response.headers.get("location")).not.toContain("provider-secret")
      },
    )
  })
})

test("OIDC callback rejects a denied provider response and clears a validated transaction", async () => {
  await withEnvironment(async () => {
    const dispatcher = createHonoDispatcher()
    addHttpRoutesAuth(dispatcher)
    const startResponse = await withFetch(
      async () => Response.json(discovery),
      async () =>
        await dispatcher.fetch(
          new Request(`${apiBaseUrl}/api/auth/oidc/start`),
          actionContextCreate([], [], createUserSession()),
        ),
    )
    const authorizationUrl = new URL(startResponse.headers.get("location") ?? "")
    const cookie = startResponse.headers.get("set-cookie")?.split(";", 1)[0] ?? ""
    const response = await dispatcher.fetch(
      new Request(
        `${callbackUrl}?state=${encodeURIComponent(authorizationUrl.searchParams.get("state") ?? "")}&error=access_denied`,
        { headers: { Cookie: cookie } },
      ),
      actionContextCreate([], [], createUserSession()),
    )

    expect(response.status).toBe(400)
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0")
    expect(await response.text()).not.toContain("access_denied")
  })
})

test("OIDC accounts bind the same subject separately for different issuers", async () => {
  const db = createDatabase()
  const ctx = { db } as unknown as MutationCtx
  const baseProvider = {
    provider: "oidc" as const,
    providerId: "same-subject",
    givenName: "Same",
    familyName: "Subject",
    image: "",
    username: "same-subject",
    email: "same@example.test",
  }

  const firstResult = await findOrCreateUserFn(ctx, { ...baseProvider, issuer: "https://one.example" })
  const secondResult = await findOrCreateUserFn(ctx, { ...baseProvider, issuer: "https://two.example" })

  expect(firstResult.success).toBe(true)
  expect(secondResult.success).toBe(true)
  expect(db.users).toHaveLength(2)
  expect(db.accounts.map((account) => account.issuer)).toEqual(["https://one.example", "https://two.example"])
})

async function signingKeysCreate() {
  const { privateKey, publicKey } = await generateKeyPair("RS256")
  const publicJwk = await exportJWK(publicKey)
  return { privateKey, publicJwk: { ...publicJwk, alg: "RS256", kid: "oidc-test-key", use: "sig" } }
}

async function idTokenCreate(
  privateKey: CryptoKey,
  nonce: string,
  overrides: Record<string, unknown> = {},
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  return new SignJWT({
    nonce,
    email: "ada@example.test",
    email_verified: true,
    given_name: "Ada",
    family_name: "User",
    preferred_username: "ada",
    ...overrides,
  })
    .setProtectedHeader({ alg: "RS256", kid: "oidc-test-key" })
    .setIssuer(issuer)
    .setAudience(clientId)
    .setSubject("subject-123")
    .setIssuedAt(now)
    .setExpirationTime(now + 300)
    .sign(privateKey)
}

function createUserSession(): UserSession {
  const now = new Date().toISOString()
  return {
    token: "session-token",
    profile: {
      userId: "user-1",
      name: "Ada User",
      email: "ada@example.test",
      role: "user",
      createdAt: now,
      updatedAt: now,
    },
    hasPw: false,
    signedInMethod: "oidc",
    signedInAt: now,
    expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
  }
}

function actionContextCreate(mutationCalls: unknown[], scheduledCalls: unknown[], userSession: UserSession) {
  return {
    runMutation: async (_reference: unknown, providerInfo: unknown) => {
      mutationCalls.push(providerInfo)
      return { success: true, data: userSession }
    },
    scheduler: {
      runAfter: async (...args: unknown[]) => {
        scheduledCalls.push(args)
      },
    },
  } as never
}

function createDatabase() {
  const users: Record<string, unknown>[] = []
  const accounts: Record<string, unknown>[] = []
  const tables = { users, authAccounts: accounts, orgMembers: [] as Record<string, unknown>[] }
  const db = {
    users,
    accounts,
    query(table: keyof typeof tables) {
      let filters: Record<string, unknown> = {}
      const builder = {
        withIndex(
          _indexName: string,
          callback: (query: { eq: (field: string, value: unknown) => typeof query }) => unknown,
        ) {
          const query = {
            eq(field: string, value: unknown) {
              filters = { ...filters, [field]: value }
              return query
            },
          }
          callback(query)
          return builder
        },
        unique() {
          return tableRows().find((row) => Object.entries(filters).every(([key, value]) => row[key] === value)) ?? null
        },
        first() {
          return tableRows()[0] ?? null
        },
      }
      return builder

      function tableRows() {
        return tables[table]
      }
    },
    async insert(table: keyof typeof tables, value: Record<string, unknown>) {
      const row = { ...value, _id: `${table}-${tables[table].length + 1}`, _creationTime: Date.now() }
      tables[table].push(row)
      return row._id
    },
    async get() {
      return null
    },
  }
  return db
}

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

async function withEnvironment<T>(callback: () => Promise<T>): Promise<T> {
  const names = [
    "AUTH_SECRET",
    "OIDC_ISSUER",
    "OIDC_CLIENT_ID",
    "OIDC_CLIENT_SECRET",
    "OIDC_SCOPES",
    "OIDC_ZITADEL_ORG_ID",
    "PUBLIC_BASE_URL_API",
    "PUBLIC_BASE_URL_APP",
    "PUBLIC_BASE_URL_SITE",
  ]
  const previous = new Map(names.map((name) => [name, process.env[name]]))
  process.env.AUTH_SECRET = "oidc-test-auth-secret"
  process.env.OIDC_ISSUER = issuer
  process.env.OIDC_CLIENT_ID = clientId
  delete process.env.OIDC_CLIENT_SECRET
  delete process.env.OIDC_SCOPES
  delete process.env.OIDC_ZITADEL_ORG_ID
  process.env.PUBLIC_BASE_URL_API = apiBaseUrl
  process.env.PUBLIC_BASE_URL_APP = appBaseUrl
  process.env.PUBLIC_BASE_URL_SITE = appBaseUrl
  try {
    return await callback()
  } finally {
    for (const [name, value] of previous) {
      if (value === undefined) delete process.env[name]
      else process.env[name] = value
    }
  }
}

const authworksIssuer = "https://authworks.example.test"
const authworksClientId = "authworks-client-id"
const authworksCallbackUrl = `${apiBaseUrl}/api/auth/oidc/authworks/callback`
const authworksDiscovery = {
  issuer: authworksIssuer,
  authorization_endpoint: `${authworksIssuer}/authorize`,
  token_endpoint: `${authworksIssuer}/token`,
  jwks_uri: `${authworksIssuer}/jwks`,
  response_types_supported: ["code"],
  id_token_signing_alg_values_supported: ["RS256"],
  token_endpoint_auth_methods_supported: ["none"],
}

test("Authworks OIDC routes complete a verified session without role grants", async () => {
  await withEnvironment(async () => {
    withAuthworksEnvironment()
    const { privateKey, publicJwk } = await signingKeysCreate()
    const mutationCalls: unknown[] = []
    const ctx = actionContextCreate(mutationCalls, [], createUserSession())
    let idTokenNonce = ""

    await withFetch(
      async (input, init) => {
        const request = new Request(input, init)
        if (request.url === `${authworksIssuer}/.well-known/openid-configuration`)
          return Response.json(authworksDiscovery)
        if (request.url === authworksDiscovery.token_endpoint)
          return Response.json({ id_token: await authworksIdTokenCreate(privateKey, idTokenNonce) })
        if (request.url === authworksDiscovery.jwks_uri) return Response.json({ keys: [publicJwk] })
        return new Response("not found", { status: 404 })
      },
      async () => {
        const dispatcher = createHonoDispatcher()
        addHttpRoutesAuth(dispatcher)
        const startResponse = await dispatcher.fetch(
          new Request(urlSignInViaAuthworksOidc("/groups?from=authworks#top")),
          ctx,
        )
        expect(startResponse.status).toBe(302)

        const authorizationUrl = new URL(startResponse.headers.get("location") ?? "")
        expect(authorizationUrl.origin + authorizationUrl.pathname).toBe(`${authworksIssuer}/authorize`)
        expect(authorizationUrl.searchParams.get("redirect_uri")).toBe(authworksCallbackUrl)
        idTokenNonce = authorizationUrl.searchParams.get("nonce") ?? ""
        const cookie = startResponse.headers.get("set-cookie")?.split(";", 1)[0] ?? ""
        const state = authorizationUrl.searchParams.get("state") ?? ""
        const callbackResponse = await dispatcher.fetch(
          new Request(`${authworksCallbackUrl}?state=${encodeURIComponent(state)}&code=authorization-code`, {
            headers: { Cookie: cookie },
          }),
          ctx,
        )

        expect(callbackResponse.status).toBe(302)
        const location = new URL(callbackResponse.headers.get("location") ?? "")
        expect(location.origin).toBe(appBaseUrl)
        expect(location.pathname).toBe("/groups")
        // Authworks issues no role claims: the trusted profile carries no role grant.
        expect(mutationCalls).toEqual([
          {
            provider: "oidc",
            issuer: authworksIssuer,
            providerId: "authworks-subject-123",
            givenName: "Ada",
            familyName: "User",
            image: "",
            username: "ada",
            email: "ada@example.test",
          },
        ])
      },
    )
  })
})

test("Authworks OIDC callback denies unadmitted organization members when configured", async () => {
  await withEnvironment(async () => {
    withAuthworksEnvironment("0199c2a1-7b3e-7f01-9a2b-3c4d5e6f7081")
    const { privateKey, publicJwk } = await signingKeysCreate()
    const mutationCalls: unknown[] = []
    const ctx = actionContextCreate(mutationCalls, [], createUserSession())
    let idTokenNonce = ""

    await withFetch(
      async (input, init) => {
        const request = new Request(input, init)
        if (request.url === `${authworksIssuer}/.well-known/openid-configuration`)
          return Response.json(authworksDiscovery)
        if (request.url === authworksDiscovery.token_endpoint)
          return Response.json({ id_token: await authworksIdTokenCreate(privateKey, idTokenNonce) })
        if (request.url === authworksDiscovery.jwks_uri) return Response.json({ keys: [publicJwk] })
        return new Response("not found", { status: 404 })
      },
      async () => {
        const dispatcher = createHonoDispatcher()
        addHttpRoutesAuth(dispatcher)
        const start = await dispatcher.fetch(new Request(urlSignInViaAuthworksOidc("/")), ctx)
        const authorization = new URL(start.headers.get("location") ?? "")
        idTokenNonce = authorization.searchParams.get("nonce") ?? ""
        const cookie = start.headers.get("set-cookie")?.split(";", 1)[0] ?? ""
        const state = authorization.searchParams.get("state") ?? ""
        const response = await dispatcher.fetch(
          new Request(`${authworksCallbackUrl}?state=${encodeURIComponent(state)}&code=authorization-code`, {
            headers: { Cookie: cookie },
          }),
          ctx,
        )

        expect(response.status).toBe(400)
        expect(mutationCalls).toHaveLength(0)
      },
    )
  })
})

test("Authworks OIDC start is not configured without an Authworks client ID", async () => {
  await withEnvironment(async () => {
    withAuthworksEnvironment()
    delete process.env.AUTHWORKS_CLIENT_ID
    const dispatcher = createHonoDispatcher()
    addHttpRoutesAuth(dispatcher)
    const response = await dispatcher.fetch(
      new Request(urlSignInViaAuthworksOidc("/")),
      actionContextCreate([], [], createUserSession()),
    )
    expect(response.status).toBe(500)
  })
})

function withAuthworksEnvironment(organizationId?: string) {
  process.env.AUTHWORKS_ISSUER = authworksIssuer
  process.env.AUTHWORKS_CLIENT_ID = authworksClientId
  delete process.env.AUTHWORKS_CLIENT_SECRET
  delete process.env.AUTHWORKS_SCOPES
  if (organizationId === undefined) delete process.env.AUTHWORKS_ORGANIZATION_ID
  else process.env.AUTHWORKS_ORGANIZATION_ID = organizationId
}

async function authworksIdTokenCreate(privateKey: CryptoKey, nonce: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  return new SignJWT({
    nonce,
    email: "ada@example.test",
    email_verified: true,
    given_name: "Ada",
    family_name: "User",
    preferred_username: "ada",
  })
    .setProtectedHeader({ alg: "RS256", kid: "oidc-test-key" })
    .setIssuer(authworksIssuer)
    .setAudience(authworksClientId)
    .setSubject("authworks-subject-123")
    .setIssuedAt(now)
    .setExpirationTime(now + 300)
    .sign(privateKey)
}
