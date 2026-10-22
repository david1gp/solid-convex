import { createLocalJWKSet, type JSONWebKeySet, jwtVerify } from "jose"
import * as a from "valibot"
import { createResult, createResultError, type PromiseResult } from "#result"
import type { AuthworksConfig } from "#src/auth/server/authworks/authworksConfig.ts"
import type { OidcDiscovery } from "#src/auth/server/oidc/oidcDiscoverySchema.ts"
import { oidcJwksSchema } from "#src/auth/server/oidc/oidcJwksSchema.ts"

const authworksAccessTokenAllowedAlgorithms = new Set([
  "RS256",
  "RS384",
  "RS512",
  "PS256",
  "PS384",
  "PS512",
  "ES256",
  "ES384",
  "ES512",
  "EdDSA",
])

const authworksProjectRolesClaim = "urn:zitadel:iam:org:project:roles"

const authworksAccessTokenRolesSchema = a.looseObject({
  iss: a.pipe(a.string(), a.minLength(1)),
  sub: a.pipe(a.string(), a.minLength(1)),
  aud: a.union([a.pipe(a.string(), a.minLength(1)), a.pipe(a.array(a.string()), a.minLength(1))]),
  exp: a.number(),
  iat: a.number(),
  [authworksProjectRolesClaim]: a.optional(a.unknown()),
})

type AuthworksAccessTokenRolesVerifyInput = {
  config: Pick<AuthworksConfig, "issuer" | "clientId">
  discovery: OidcDiscovery
  accessToken: string
  currentDate?: Date
}

export async function authworksAccessTokenRolesVerify(
  input: AuthworksAccessTokenRolesVerifyInput,
): PromiseResult<unknown> {
  const op = "authworksAccessTokenRolesVerify"
  if (input.discovery.issuer !== input.config.issuer) {
    return createResultError(op, "Authworks discovery issuer mismatch")
  }
  if (!input.accessToken || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/u.test(input.accessToken)) {
    return createResultError(op, "missing or invalid Authworks access token")
  }
  if (!authworksHttpsUrlIsValid(input.discovery.jwks_uri)) {
    return createResultError(op, "invalid Authworks JWKS endpoint")
  }
  const algorithms = input.discovery.id_token_signing_alg_values_supported.filter((algorithm) =>
    authworksAccessTokenAllowedAlgorithms.has(algorithm),
  )
  if (algorithms.length === 0) return createResultError(op, "no supported Authworks token signing algorithm")

  let response: Response
  let text: string
  try {
    response = await fetch(input.discovery.jwks_uri, { headers: { Accept: "application/json" } })
    text = await response.text()
  } catch {
    return createResultError(op, "could not fetch Authworks JWKS")
  }
  if (!response.ok) return createResultError(op, "could not fetch Authworks JWKS")
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    return createResultError(op, "invalid Authworks JWKS JSON")
  }
  const jwksResult = a.safeParse(oidcJwksSchema, json)
  if (!jwksResult.success) return createResultError(op, "invalid Authworks JWKS")

  const currentDate = input.currentDate ?? new Date()
  if (!Number.isFinite(currentDate.getTime())) return createResultError(op, "invalid Authworks verification date")

  let verified: Awaited<ReturnType<typeof jwtVerify>>
  try {
    verified = await jwtVerify(input.accessToken, createLocalJWKSet(jwksResult.output as JSONWebKeySet), {
      algorithms,
      audience: input.config.clientId,
      issuer: input.discovery.issuer,
      currentDate,
      clockTolerance: 60,
      requiredClaims: ["iss", "sub", "aud", "exp", "iat"],
    })
  } catch {
    return createResultError(op, "Authworks access-token signature or claims verification failed")
  }

  const claimsResult = a.safeParse(authworksAccessTokenRolesSchema, verified.payload)
  if (!claimsResult.success) return createResultError(op, "invalid verified Authworks access-token claims")
  const claims = claimsResult.output
  if (claims.sub.trim() === "") return createResultError(op, "Authworks access-token subject is empty")
  if (Array.isArray(claims.aud) && claims.aud.length > 1 && !claims.aud.includes(input.config.clientId)) {
    return createResultError(op, "Authworks access-token audience mismatch")
  }
  if (!Number.isFinite(claims.iat) || !Number.isFinite(claims.exp) || claims.exp <= claims.iat) {
    return createResultError(op, "invalid Authworks access-token time claims")
  }
  return createResult(claims[authworksProjectRolesClaim])
}

function authworksHttpsUrlIsValid(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === "https:" && !url.username && !url.password && !url.search && !url.hash
  } catch {
    return false
  }
}
