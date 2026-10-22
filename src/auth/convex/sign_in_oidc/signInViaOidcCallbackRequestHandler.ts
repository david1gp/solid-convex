import { internal } from "#convex/_generated/api.js"
import type { ActionCtx } from "#convex/_generated/server.js"
import { oidcRequestErrorResponseCreate } from "#src/auth/convex/sign_in_shared/oidcRequestErrorResponseCreate.ts"
import { signInCallbackCompletionResponseCreate } from "#src/auth/convex/sign_in_shared/signInCallbackCompletionResponseCreate.ts"
import { oidcAuthworksAdmissionCheck } from "#src/auth/server/oidc/oidcAuthworksAdmissionCheck.ts"
import { oidcAuthworksConfigGet } from "#src/auth/server/oidc/oidcAuthworksConfigGet.ts"
import { oidcCallbackUrlGet } from "#src/auth/server/oidc/oidcCallbackUrlGet.ts"
import type { OidcProviderKey } from "#src/auth/server/oidc/oidcConfig.ts"
import { oidcConfigGet } from "#src/auth/server/oidc/oidcConfigGet.ts"
import { oidcDiscoveryGet } from "#src/auth/server/oidc/oidcDiscoveryGet.ts"
import { oidcIdTokenVerify } from "#src/auth/server/oidc/oidcIdTokenVerify.ts"
import { oidcTokenExchange } from "#src/auth/server/oidc/oidcTokenExchange.ts"
import { oidcTransactionCookie } from "#src/auth/server/oidc/oidcTransactionCookie.ts"
import { oidcTrustedProfileCreate } from "#src/auth/server/oidc/oidcTrustedProfileCreate.ts"
import { oidcUserInfoGet } from "#src/auth/server/oidc/oidcUserInfoGet.ts"
import { oidcZitadelRoleGet } from "#src/auth/server/oidc/oidcZitadelRoleGet.ts"

export async function signInViaOidcCallbackRequestHandler(
  ctx: ActionCtx,
  request: Request,
  provider: OidcProviderKey = "zitadel",
): Promise<Response> {
  const op = "signInViaOidcCallbackRequestHandler"
  const url = new URL(request.url)
  const state = url.searchParams.get("state")
  if (!state) return oidcRequestErrorResponseCreate(op, "missing state", 400)

  const transactionResult = await oidcTransactionCookie.readHeaders(request, state)
  if (!transactionResult.success) {
    console.warn(transactionResult)
    return oidcRequestErrorResponseCreate(op, "invalid transaction state", 400)
  }
  const clearCookieHeaders = oidcTransactionCookie.clearHeaders()

  if (url.searchParams.has("error")) {
    return oidcRequestErrorResponseCreate(op, "OIDC authentication was denied", 400, clearCookieHeaders)
  }

  const code = url.searchParams.get("code")
  if (!code) return oidcRequestErrorResponseCreate(op, "missing code", 400, clearCookieHeaders)

  const configResult = provider === "authworks" ? oidcAuthworksConfigGet() : oidcConfigGet()
  if (!configResult.success) {
    console.error(configResult)
    return oidcRequestErrorResponseCreate(op, "OIDC sign-in is not configured", 500, clearCookieHeaders)
  }

  const callbackUrlResult = oidcCallbackUrlGet(provider)
  if (!callbackUrlResult.success) {
    console.error(callbackUrlResult)
    return oidcRequestErrorResponseCreate(op, "OIDC sign-in callback is not configured", 500, clearCookieHeaders)
  }

  const discoveryResult = await oidcDiscoveryGet(configResult.data)
  if (!discoveryResult.success) {
    console.error(discoveryResult)
    return oidcRequestErrorResponseCreate(op, "could not load OIDC configuration", 500, clearCookieHeaders)
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
    return oidcRequestErrorResponseCreate(op, "could not exchange OIDC authorization code", 400, clearCookieHeaders)
  }

  const claimsResult = await oidcIdTokenVerify({
    config: configResult.data,
    discovery: discoveryResult.data,
    idToken: tokenResult.data.id_token,
    nonce: transactionResult.data.nonce,
  })
  if (!claimsResult.success) {
    console.warn(op, "OIDC ID-token verification failed")
    return oidcRequestErrorResponseCreate(op, "could not verify OIDC ID token", 400, clearCookieHeaders)
  }

  if (provider === "authworks") {
    const admissionResult = oidcAuthworksAdmissionCheck(claimsResult.data, configResult.data.authworksOrgId)
    if (!admissionResult.success) {
      console.warn(admissionResult)
      return oidcRequestErrorResponseCreate(op, "could not verify OIDC ID token", 400, clearCookieHeaders)
    }
  }

  const idTokenName = claimsResult.data.given_name?.trim() || claimsResult.data.name?.trim()
  const userInfoResult = await oidcUserInfoGet({
    discovery: discoveryResult.data,
    accessToken: tokenResult.data.access_token,
    subject: claimsResult.data.sub,
    needsName: !idTokenName,
    needsPicture: !claimsResult.data.picture?.trim(),
  })
  // Authworks issues no role claims: an Authworks sign-in never grants,
  // removes, or syncs admin rights — new users get the default user role and
  // existing users keep theirs (see userRoleSyncFromAuthProviderFn).
  const providerInfo = oidcTrustedProfileCreate(
    claimsResult.data,
    configResult.data.zitadelOrgId
      ? oidcZitadelRoleGet(claimsResult.data["urn:zitadel:iam:org:project:roles"], configResult.data.zitadelOrgId)
      : undefined,
    userInfoResult.success ? userInfoResult.data : undefined,
  )
  let sessionResult: Awaited<ReturnType<ActionCtx["runMutation"]>>
  try {
    sessionResult = await ctx.runMutation(internal.auth.signInUsingSocialAuth3InternalMutation, providerInfo)
  } catch {
    return oidcRequestErrorResponseCreate(op, "could not create auth session", 500, clearCookieHeaders)
  }
  if (!sessionResult.success) {
    console.warn(op, "OIDC auth session creation failed")
    return oidcRequestErrorResponseCreate(op, "could not create auth session", 400, clearCookieHeaders)
  }

  return signInCallbackCompletionResponseCreate(
    ctx,
    sessionResult.data,
    transactionResult.data.returnTo,
    "oauth",
    clearCookieHeaders,
  )
}
