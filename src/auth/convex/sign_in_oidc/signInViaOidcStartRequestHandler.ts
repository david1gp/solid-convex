import type { ActionCtx } from "#convex/_generated/server.js"
import { oidcRequestErrorResponseCreate } from "#src/auth/convex/sign_in_shared/oidcRequestErrorResponseCreate.ts"
import { oidcAuthorizationUrlCreate } from "#src/auth/server/oidc/oidcAuthorizationUrlCreate.ts"
import { oidcAuthworksConfigGet } from "#src/auth/server/oidc/oidcAuthworksConfigGet.ts"
import { oidcCallbackUrlGet } from "#src/auth/server/oidc/oidcCallbackUrlGet.ts"
import type { OidcProviderKey } from "#src/auth/server/oidc/oidcConfig.ts"
import { oidcConfigGet } from "#src/auth/server/oidc/oidcConfigGet.ts"
import { oidcDiscoveryGet } from "#src/auth/server/oidc/oidcDiscoveryGet.ts"
import { oidcTransactionCookie } from "#src/auth/server/oidc/oidcTransactionCookie.ts"

export async function signInViaOidcStartRequestHandler(
  _ctx: ActionCtx,
  request: Request,
  provider: OidcProviderKey = "zitadel",
): Promise<Response> {
  const op = "signInViaOidcStartRequestHandler"
  const configResult = provider === "authworks" ? oidcAuthworksConfigGet() : oidcConfigGet()
  if (!configResult.success) {
    console.error(configResult)
    return oidcRequestErrorResponseCreate(op, "OIDC sign-in is not configured", 500)
  }

  const callbackUrlResult = oidcCallbackUrlGet(provider)
  if (!callbackUrlResult.success) {
    console.error(callbackUrlResult)
    return oidcRequestErrorResponseCreate(op, "OIDC sign-in callback is not configured", 500)
  }

  const returnTo = new URL(request.url).searchParams.get("returnTo")
  const transactionResult = await oidcTransactionCookie.createHeaders(returnTo)
  if (!transactionResult.success) {
    console.error(transactionResult)
    return oidcRequestErrorResponseCreate(op, "could not start OIDC sign-in", 500)
  }

  const discoveryResult = await oidcDiscoveryGet(configResult.data)
  if (!discoveryResult.success) {
    console.error(discoveryResult)
    return oidcRequestErrorResponseCreate(op, "could not load OIDC configuration", 500)
  }

  const authorizationUrlResult = await oidcAuthorizationUrlCreate({
    config: configResult.data,
    discovery: discoveryResult.data,
    redirectUri: callbackUrlResult.data,
    state: transactionResult.data.transaction.state,
    nonce: transactionResult.data.transaction.nonce,
    codeVerifier: transactionResult.data.transaction.codeVerifier,
  })
  if (!authorizationUrlResult.success) {
    console.error(authorizationUrlResult)
    return oidcRequestErrorResponseCreate(op, "could not start OIDC sign-in", 500)
  }

  const headers = new Headers(transactionResult.data.headers)
  headers.set("Location", authorizationUrlResult.data)
  return new Response(null, { status: 302, headers })
}
