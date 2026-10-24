import { internal } from "#convex/_generated/api.js"
import type { ActionCtx } from "#convex/_generated/server.js"
import { oidcRequestErrorResponseCreate } from "#src/auth/convex/sign_in_shared/oidcRequestErrorResponseCreate.ts"
import { signInCallbackCompletionResponseCreate } from "#src/auth/convex/sign_in_shared/signInCallbackCompletionResponseCreate.ts"
import { oidcCallbackUrlGet } from "#src/auth/server/oidc/oidcCallbackUrlGet.ts"
import { oidcConfigGet } from "#src/auth/server/oidc/oidcConfigGet.ts"
import { oidcDiscoveryGet } from "#src/auth/server/oidc/oidcDiscoveryGet.ts"
import { oidcIdTokenVerify } from "#src/auth/server/oidc/oidcIdTokenVerify.ts"
import { oidcTokenExchange } from "#src/auth/server/oidc/oidcTokenExchange.ts"
import { oidcTransactionCookie } from "#src/auth/server/oidc/oidcTransactionCookie.ts"
import { oidcTrustedProfileCreate } from "#src/auth/server/oidc/oidcTrustedProfileCreate.ts"
import { oidcUserInfoGet } from "#src/auth/server/oidc/oidcUserInfoGet.ts"
import { oidcZitadelRawRolesExtract } from "#src/auth/server/oidc/oidcZitadelRawRolesExtract.ts"
import { oidcZitadelRoleGet } from "#src/auth/server/oidc/oidcZitadelRoleGet.ts"
import { oidcZitadelRolesGet } from "#src/auth/server/oidc/oidcZitadelRolesGet.ts"

export async function signInViaOidcCallbackRequestHandler(ctx: ActionCtx, request: Request): Promise<Response> {
  const op = "signInViaOidcCallbackRequestHandler"
  const url = new URL(request.url)
  const state = url.searchParams.get("state")
  if (!state) return oidcRequestErrorResponseCreate(op, "missing state", "auth.bad-request")

  const transactionResult = await oidcTransactionCookie.readHeaders(request, state)
  if (!transactionResult.success) {
    console.warn(transactionResult)
    return oidcRequestErrorResponseCreate(op, "invalid transaction state", "auth.bad-request")
  }
  const clearCookieHeaders = oidcTransactionCookie.clearHeaders()

  if (url.searchParams.has("error")) {
    return oidcRequestErrorResponseCreate(op, "OIDC authentication was denied", "auth.bad-request", clearCookieHeaders)
  }

  const code = url.searchParams.get("code")
  if (!code) return oidcRequestErrorResponseCreate(op, "missing code", "auth.bad-request", clearCookieHeaders)

  const configResult = oidcConfigGet()
  if (!configResult.success) {
    console.error(configResult)
    return oidcRequestErrorResponseCreate(op, "OIDC sign-in is not configured", "auth.internal", clearCookieHeaders)
  }

  const callbackUrlResult = oidcCallbackUrlGet()
  if (!callbackUrlResult.success) {
    console.error(callbackUrlResult)
    return oidcRequestErrorResponseCreate(
      op,
      "OIDC sign-in callback is not configured",
      "auth.internal",
      clearCookieHeaders,
    )
  }

  const discoveryResult = await oidcDiscoveryGet(configResult.data)
  if (!discoveryResult.success) {
    console.error(discoveryResult)
    return oidcRequestErrorResponseCreate(op, "could not load OIDC configuration", "auth.internal", clearCookieHeaders)
  }

  const tokenResult = await oidcTokenExchange({
    config: configResult.data,
    discovery: discoveryResult.data,
    code,
    codeVerifier: transactionResult.data.codeVerifier,
    redirectUri: callbackUrlResult.data,
  })
  if (!tokenResult.success) {
    console.warn(op, "OIDC authorization code exchange failed")
    return oidcRequestErrorResponseCreate(
      op,
      "could not exchange OIDC authorization code",
      "auth.bad-request",
      clearCookieHeaders,
    )
  }

  const claimsResult = await oidcIdTokenVerify({
    config: configResult.data,
    discovery: discoveryResult.data,
    idToken: tokenResult.data.id_token,
    nonce: transactionResult.data.nonce,
  })
  if (!claimsResult.success) {
    console.warn(op, "OIDC ID-token verification failed")
    return oidcRequestErrorResponseCreate(op, "could not verify OIDC ID token", "auth.bad-request", clearCookieHeaders)
  }

  const idTokenName = claimsResult.data.given_name?.trim() || claimsResult.data.name?.trim()
  const userInfoResult = await oidcUserInfoGet({
    discovery: discoveryResult.data,
    accessToken: tokenResult.data.access_token,
    subject: claimsResult.data.sub,
    needsName: !idTokenName,
    needsPicture: !claimsResult.data.picture?.trim(),
    needsClaims: Boolean(configResult.data.zitadelOrgId),
  })
  const combinedClaims = {
    ...(claimsResult.data as Record<string, unknown>),
    ...(userInfoResult.success ? (userInfoResult.data?.claims ?? {}) : {}),
  }
  const rawRoles = oidcZitadelRawRolesExtract(combinedClaims, process.env.ZITADEL_PROJECT_ID)
  const zitadelRoles = configResult.data.zitadelOrgId
    ? oidcZitadelRolesGet(rawRoles, configResult.data.zitadelOrgId)
    : undefined
  const zitadelRole = configResult.data.zitadelOrgId
    ? oidcZitadelRoleGet(rawRoles, configResult.data.zitadelOrgId)
    : undefined
  const providerInfo = oidcTrustedProfileCreate(
    claimsResult.data,
    zitadelRole,
    userInfoResult.success ? userInfoResult.data : undefined,
    zitadelRoles,
  )
  let sessionResult: Awaited<ReturnType<ActionCtx["runMutation"]>>
  try {
    sessionResult = await ctx.runMutation(internal.auth.signInUsingSocialAuth3InternalMutation, providerInfo)
  } catch {
    return oidcRequestErrorResponseCreate(op, "could not create auth session", "auth.internal", clearCookieHeaders)
  }
  if (!sessionResult.success) {
    console.warn(op, "OIDC auth session creation failed")
    return oidcRequestErrorResponseCreate(op, "could not create auth session", "auth.bad-request", clearCookieHeaders)
  }

  return signInCallbackCompletionResponseCreate(
    ctx,
    sessionResult.data,
    transactionResult.data.returnTo,
    "oauth",
    clearCookieHeaders,
  )
}
