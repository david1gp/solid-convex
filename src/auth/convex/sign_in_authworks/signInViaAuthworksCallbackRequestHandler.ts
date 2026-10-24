import { internal } from "#convex/_generated/api.js"
import type { ActionCtx } from "#convex/_generated/server.js"
import { oidcRequestErrorResponseCreate } from "#src/auth/convex/sign_in_shared/oidcRequestErrorResponseCreate.ts"
import { signInCallbackCompletionResponseCreate } from "#src/auth/convex/sign_in_shared/signInCallbackCompletionResponseCreate.ts"
import { authworksAccessTokenRolesVerify } from "#src/auth/server/authworks/authworksAccessTokenRolesVerify.ts"
import { authworksCallbackUrlGet } from "#src/auth/server/authworks/authworksCallbackUrlGet.ts"
import { authworksConfigGet } from "#src/auth/server/authworks/authworksConfigGet.ts"
import { authworksTransactionCookie } from "#src/auth/server/authworks/authworksTransactionCookie.ts"
import { oidcDiscoveryGet } from "#src/auth/server/oidc/oidcDiscoveryGet.ts"
import { oidcIdTokenVerify } from "#src/auth/server/oidc/oidcIdTokenVerify.ts"
import { oidcTokenExchange } from "#src/auth/server/oidc/oidcTokenExchange.ts"
import { oidcTrustedProfileCreate } from "#src/auth/server/oidc/oidcTrustedProfileCreate.ts"
import { oidcUserInfoGet } from "#src/auth/server/oidc/oidcUserInfoGet.ts"
import { oidcZitadelRawRolesExtract } from "#src/auth/server/oidc/oidcZitadelRawRolesExtract.ts"
import { oidcZitadelRoleGet } from "#src/auth/server/oidc/oidcZitadelRoleGet.ts"
import { oidcZitadelRolesGet } from "#src/auth/server/oidc/oidcZitadelRolesGet.ts"

const authworksProjectRolesClaim = "urn:zitadel:iam:org:project:roles"

export async function signInViaAuthworksCallbackRequestHandler(ctx: ActionCtx, request: Request): Promise<Response> {
  const op = "signInViaAuthworksCallbackRequestHandler"
  const url = new URL(request.url)
  const state = url.searchParams.get("state")
  if (!state) return oidcRequestErrorResponseCreate(op, "missing state", "auth.bad-request")

  const transactionResult = await authworksTransactionCookie.readHeaders(request, state)
  if (!transactionResult.success) {
    console.warn(transactionResult)
    return oidcRequestErrorResponseCreate(op, "invalid transaction state", "auth.bad-request")
  }
  const clearCookieHeaders = authworksTransactionCookie.clearHeaders()

  if (url.searchParams.has("error")) {
    return oidcRequestErrorResponseCreate(
      op,
      "Authworks authentication was denied",
      "auth.bad-request",
      clearCookieHeaders,
    )
  }

  const code = url.searchParams.get("code")
  if (!code) return oidcRequestErrorResponseCreate(op, "missing code", "auth.bad-request", clearCookieHeaders)

  const configResult = authworksConfigGet()
  if (!configResult.success) {
    console.error(configResult)
    return oidcRequestErrorResponseCreate(
      op,
      "Authworks sign-in is not configured",
      "auth.internal",
      clearCookieHeaders,
    )
  }
  const oidcConfig = {
    issuer: configResult.data.issuer,
    clientId: configResult.data.clientId,
    clientSecret: configResult.data.clientSecret,
    scopes: [...configResult.data.scopes],
  }

  const callbackUrlResult = authworksCallbackUrlGet()
  if (!callbackUrlResult.success) {
    console.error(callbackUrlResult)
    return oidcRequestErrorResponseCreate(
      op,
      "Authworks sign-in callback is not configured",
      "auth.internal",
      clearCookieHeaders,
    )
  }

  const discoveryResult = await oidcDiscoveryGet(oidcConfig)
  if (!discoveryResult.success) {
    console.error(discoveryResult)
    return oidcRequestErrorResponseCreate(
      op,
      "could not load Authworks configuration",
      "auth.internal",
      clearCookieHeaders,
    )
  }

  const tokenResult = await oidcTokenExchange({
    config: oidcConfig,
    discovery: discoveryResult.data,
    code,
    codeVerifier: transactionResult.data.codeVerifier,
    redirectUri: callbackUrlResult.data,
  })
  if (!tokenResult.success) {
    console.warn(op, "Authworks authorization code exchange failed")
    return oidcRequestErrorResponseCreate(
      op,
      "could not exchange Authworks authorization code",
      "auth.bad-request",
      clearCookieHeaders,
    )
  }

  const claimsResult = await oidcIdTokenVerify({
    config: oidcConfig,
    discovery: discoveryResult.data,
    idToken: tokenResult.data.id_token,
    nonce: transactionResult.data.nonce,
  })
  if (!claimsResult.success) {
    console.warn(op, "Authworks ID-token verification failed")
    return oidcRequestErrorResponseCreate(
      op,
      "could not verify Authworks ID token",
      "auth.bad-request",
      clearCookieHeaders,
    )
  }

  const idTokenName = claimsResult.data.given_name?.trim() || claimsResult.data.name?.trim()
  const userInfoResult = await oidcUserInfoGet({
    discovery: discoveryResult.data,
    accessToken: tokenResult.data.access_token,
    subject: claimsResult.data.sub,
    needsName: !idTokenName,
    needsPicture: !claimsResult.data.picture?.trim(),
    needsClaims: false,
  })
  // Authworks issues project-role claims in the verified access token (never in
  // the ID token or UserInfo). A failed access-token role read degrades to no
  // roles; it never fails the sign-in. Role mapping additionally requires
  // AUTHWORKS_ORGANIZATION_ID so the Zitadel organization namespace is never
  // applied to Authworks claims.
  const accessRolesResult = await authworksAccessTokenRolesVerify({
    config: oidcConfig,
    discovery: discoveryResult.data,
    accessToken: tokenResult.data.access_token ?? "",
  })
  if (!accessRolesResult.success) console.warn(op, "Authworks access-token role verification failed")
  const combinedClaims = {
    ...(claimsResult.data as Record<string, unknown>),
    ...(userInfoResult.success ? (userInfoResult.data?.claims ?? {}) : {}),
    ...(accessRolesResult.success && accessRolesResult.data !== undefined
      ? { [authworksProjectRolesClaim]: accessRolesResult.data }
      : {}),
  }
  const rawRoles = oidcZitadelRawRolesExtract(combinedClaims, process.env.ZITADEL_PROJECT_ID)
  const authworksRoles = configResult.data.authworksOrgId
    ? oidcZitadelRolesGet(rawRoles, configResult.data.authworksOrgId)
    : undefined
  const authworksRole = configResult.data.authworksOrgId
    ? oidcZitadelRoleGet(rawRoles, configResult.data.authworksOrgId)
    : undefined
  const providerInfo = oidcTrustedProfileCreate(
    claimsResult.data,
    authworksRole,
    userInfoResult.success ? userInfoResult.data : undefined,
    authworksRoles,
  )
  let sessionResult: Awaited<ReturnType<ActionCtx["runMutation"]>>
  try {
    sessionResult = await ctx.runMutation(internal.auth.signInUsingSocialAuth3InternalMutation, providerInfo)
  } catch {
    return oidcRequestErrorResponseCreate(op, "could not create auth session", "auth.internal", clearCookieHeaders)
  }
  if (!sessionResult.success) {
    console.warn(op, "Authworks auth session creation failed")
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
