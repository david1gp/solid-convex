import { expect, test } from "bun:test"
import { exportJWK, generateKeyPair, SignJWT } from "jose"
import type { MutationCtx } from "#convex/_generated/server.js"
import { addHttpRoutesAuth } from "#src/auth/convex/addHttpRoutesAuth.ts"
import { findOrCreateUserFn } from "#src/auth/convex/crud/findOrCreateUserFn.ts"
import { createHonoDispatcher } from "#src/auth/convex/headers/createHonoDispatcher.ts"
import type { UserSession } from "#src/auth/model/UserSession.ts"
import { urlSignInViaAuthworks } from "#src/auth/url/urlSignInViaAuthworks.ts"
import { base64urlDecodeObject } from "#utils/url/base64url.js"

const issuer = "https://authworks.example.test"
const clientId = "authworks-client-id"
const authworksOrgId = "01a03273-0662-7b18-9b48-3a7ab29f0bfd"
const resourceOwnerClaim = "urn:zitadel:iam:user:resourceowner:id"
const apiBaseUrl = "https://api.example.test"
const appBaseUrl = "https://app.example.test"
const callbackUrl = `${apiBaseUrl}/api/auth/authworks/callback`
const discovery = {
  issuer,
  authorization_endpoint: `${issuer}/authorize`,
  token_endpoint: `${issuer}/token`,
  jwks_uri: `${issuer}/jwks`,
  userinfo_endpoint: `${issuer}/userinfo`,
  response_types_supported: ["code"],
  id_token_signing_alg_values_supported: ["RS256"],
  token_endpoint_auth_methods_supported: ["client_secret_basic"],
}

test("Authworks admits the configured organization and keeps verified access-token roles", async () => {
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
          return Response.json({
            id_token: await idTokenCreate(privateKey, idTokenNonce, { [resourceOwnerClaim]: authworksOrgId }),
            access_token: await accessTokenCreate(privateKey, {
              "urn:zitadel:iam:org:project:roles": { admin: { [authworksOrgId]: "primary.example.test" } },
            }),
          })
        if (request.url === discovery.jwks_uri) return Response.json({ keys: [publicJwk] })
        if (request.url === discovery.userinfo_endpoint)
          return Response.json({ sub: "subject-123", name: "Ada Lovelace" })
        return new Response("not found", { status: 404 })
      },
      async () => {
        const dispatcher = createHonoDispatcher()
        addHttpRoutesAuth(dispatcher)
        const startResponse = await dispatcher.fetch(
          new Request(urlSignInViaAuthworks("/groups?from=authworks#top")),
          ctx,
        )
        expect(startResponse.status).toBe(302)

        const authorizationUrl = new URL(startResponse.headers.get("location") ?? "")
        expect(authorizationUrl.origin + authorizationUrl.pathname).toBe(`${issuer}/authorize`)
        expect(authorizationUrl.searchParams.get("redirect_uri")).toBe(callbackUrl)
        expect(authorizationUrl.searchParams.get("code_challenge_method")).toBe("S256")
        expect(authorizationUrl.searchParams.get("scope")).toContain("urn:zitadel:iam:org:project:role:member")
        expect(authorizationUrl.searchParams.get("scope")?.split(" ")).toContain("urn:zitadel:iam:user:resourceowner")
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
        expect(location.searchParams.get("from")).toBe("authworks")
        expect(new URLSearchParams(location.hash.slice(1)).get("returnHash")).toBe("#top")
        expect(location.searchParams.has("userSession")).toBe(false)
        expect(
          base64urlDecodeObject(new URLSearchParams(location.hash.slice(1)).get("userSession") ?? "").success,
        ).toBe(true)
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
            role: "admin",
            roles: ["admin"],
          },
        ])
        expect(scheduledCalls).toHaveLength(1)
      },
    )
  }, authworksOrgId)
})

test.each([
  { name: "missing", claims: {} },
  { name: "mismatched", claims: { [resourceOwnerClaim]: "01a03273-0662-7b18-9b48-3a7ab29f0bfe" } },
  { name: "malformed", claims: { [resourceOwnerClaim]: 123 } },
])("Authworks denies admission when the verified organization claim is $name", async ({ claims }) => {
  await withEnvironment(async () => {
    const { privateKey, publicJwk } = await signingKeysCreate()
    const mutationCalls: unknown[] = []
    const ctx = actionContextCreate(mutationCalls, [], createUserSession())
    let nonce = ""

    await withFetch(
      async (input, init) => {
        const request = new Request(input, init)
        if (request.url === `${issuer}/.well-known/openid-configuration`) return Response.json(discovery)
        if (request.url === discovery.token_endpoint) {
          return Response.json({ id_token: await idTokenCreate(privateKey, nonce, claims) })
        }
        if (request.url === discovery.jwks_uri) return Response.json({ keys: [publicJwk] })
        throw new Error(`Unexpected request: ${request.url}`)
      },
      async () => {
        const dispatcher = createHonoDispatcher()
        addHttpRoutesAuth(dispatcher)
        const start = await dispatcher.fetch(new Request(urlSignInViaAuthworks("/")), ctx)
        expect(start.status).toBe(302)
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

        expect(response.status).toBe(403)
        expect(response.headers.get("set-cookie")).toContain("Max-Age=0")
        expect(mutationCalls).toHaveLength(0)
      },
    )
  }, authworksOrgId)
})

test("Authworks callback without project roles signs in with the default role", async () => {
  await withEnvironment(async () => {
    const { privateKey, publicJwk } = await signingKeysCreate()
    const mutationCalls: unknown[] = []
    const ctx = actionContextCreate(mutationCalls, [], createUserSession())
    let nonce = ""

    await withFetch(
      async (input, init) => {
        const request = new Request(input, init)
        if (request.url === `${issuer}/.well-known/openid-configuration`) return Response.json(discovery)
        if (request.url === discovery.token_endpoint)
          return Response.json({
            id_token: await idTokenCreate(privateKey, nonce),
            access_token: await accessTokenCreate(privateKey),
          })
        if (request.url === discovery.jwks_uri) return Response.json({ keys: [publicJwk] })
        if (request.url === discovery.userinfo_endpoint) return Response.json({ sub: "subject-123" })
        return new Response("not found", { status: 404 })
      },
      async () => {
        const dispatcher = createHonoDispatcher()
        addHttpRoutesAuth(dispatcher)
        const start = await dispatcher.fetch(new Request(urlSignInViaAuthworks("/")), ctx)
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
            role: "user",
            roles: [],
          },
        ])
      },
    )
  })
})

test("Authworks callback with an unverifiable access token still signs in without roles", async () => {
  await withEnvironment(async () => {
    const { privateKey, publicJwk } = await signingKeysCreate()
    const { privateKey: unknownKey } = await generateKeyPair("RS256")
    const mutationCalls: unknown[] = []
    const ctx = actionContextCreate(mutationCalls, [], createUserSession())
    let nonce = ""

    await withFetch(
      async (input, init) => {
        const request = new Request(input, init)
        if (request.url === `${issuer}/.well-known/openid-configuration`) return Response.json(discovery)
        if (request.url === discovery.token_endpoint)
          return Response.json({
            id_token: await idTokenCreate(privateKey, nonce),
            access_token: await accessTokenCreate(unknownKey, {
              "urn:zitadel:iam:org:project:roles": { admin: { [authworksOrgId]: "primary.example.test" } },
            }),
          })
        if (request.url === discovery.jwks_uri) return Response.json({ keys: [publicJwk] })
        if (request.url === discovery.userinfo_endpoint) return Response.json({ sub: "subject-123" })
        return new Response("not found", { status: 404 })
      },
      async () => {
        const dispatcher = createHonoDispatcher()
        addHttpRoutesAuth(dispatcher)
        const start = await dispatcher.fetch(new Request(urlSignInViaAuthworks("/")), ctx)
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
            role: "user",
            roles: [],
          },
        ])
      },
    )
  })
})

test("Authworks callback rejects a denied provider response and clears a validated transaction", async () => {
  await withEnvironment(async () => {
    const dispatcher = createHonoDispatcher()
    addHttpRoutesAuth(dispatcher)
    const startResponse = await withFetch(
      async () => Response.json(discovery),
      async () =>
        await dispatcher.fetch(
          new Request(`${apiBaseUrl}/api/auth/authworks/start`),
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

test("Authworks accounts bind the same subject separately for the Authworks issuer", async () => {
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

  const authworksResult = await findOrCreateUserFn(ctx, { ...baseProvider, issuer })
  const zitadelResult = await findOrCreateUserFn(ctx, {
    ...baseProvider,
    issuer: "https://auth.contentoren.de",
  })

  expect(authworksResult.success).toBe(true)
  expect(zitadelResult.success).toBe(true)
  expect(db.users).toHaveLength(2)
  expect(db.accounts.map((account) => account.issuer)).toEqual([issuer, "https://auth.contentoren.de"])
})

async function signingKeysCreate() {
  const { privateKey, publicKey } = await generateKeyPair("RS256")
  const publicJwk = await exportJWK(publicKey)
  return { privateKey, publicJwk: { ...publicJwk, alg: "RS256", kid: "authworks-test-key", use: "sig" } }
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
    .setProtectedHeader({ alg: "RS256", kid: "authworks-test-key" })
    .setIssuer(issuer)
    .setAudience(clientId)
    .setSubject("subject-123")
    .setIssuedAt(now)
    .setExpirationTime(now + 300)
    .sign(privateKey)
}

async function accessTokenCreate(privateKey: CryptoKey, extraClaims: Record<string, unknown> = {}): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  return new SignJWT({ ...extraClaims })
    .setProtectedHeader({ alg: "RS256", kid: "authworks-test-key" })
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

async function withEnvironment<T>(callback: () => Promise<T>, admissionOrgId?: string): Promise<T> {
  const names = [
    "AUTH_SECRET",
    "AUTHWORKS_ISSUER",
    "AUTHWORKS_CLIENT_ID",
    "AUTHWORKS_CLIENT_SECRET",
    "AUTHWORKS_SCOPE",
    "AUTHWORKS_REDIRECT_URI",
    "AUTHWORKS_ORGANIZATION_ID",
    "AUTHWORKS_ADMISSION_ORGANIZATION_ID",
    "PUBLIC_BASE_URL_API",
    "PUBLIC_BASE_URL_APP",
    "PUBLIC_BASE_URL_SITE",
  ]
  const previous = new Map(names.map((name) => [name, process.env[name]]))
  process.env.AUTH_SECRET = "authworks-test-auth-secret"
  process.env.AUTHWORKS_ISSUER = issuer
  process.env.AUTHWORKS_CLIENT_ID = clientId
  process.env.AUTHWORKS_CLIENT_SECRET = "authworks-client-secret"
  delete process.env.AUTHWORKS_SCOPE
  process.env.AUTHWORKS_REDIRECT_URI = callbackUrl
  process.env.AUTHWORKS_ORGANIZATION_ID = authworksOrgId
  if (admissionOrgId === undefined) delete process.env.AUTHWORKS_ADMISSION_ORGANIZATION_ID
  else process.env.AUTHWORKS_ADMISSION_ORGANIZATION_ID = admissionOrgId
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
