import type { ActionCtx } from "#convex/_generated/server.js"
import { oidcRequestErrorResponseCreate } from "#src/auth/convex/sign_in_shared/oidcRequestErrorResponseCreate.ts"
import { authworksCallbackUrlGet } from "#src/auth/server/authworks/authworksCallbackUrlGet.ts"
import { authworksConfigGet } from "#src/auth/server/authworks/authworksConfigGet.ts"
import { authworksTransactionCookie } from "#src/auth/server/authworks/authworksTransactionCookie.ts"
import { oidcAuthorizationUrlCreate } from "#src/auth/server/oidc/oidcAuthorizationUrlCreate.ts"
import { oidcDiscoveryGet } from "#src/auth/server/oidc/oidcDiscoveryGet.ts"

export async function signInViaAuthworksStartRequestHandler(_ctx: ActionCtx, request: Request): Promise<Response> {
  const op = "signInViaAuthworksStartRequestHandler"
  const configResult = authworksConfigGet()
  if (!configResult.success) {
    console.error(configResult)
    return oidcRequestErrorResponseCreate(op, "Authworks sign-in is not configured", 500)
  }

  const callbackUrlResult = authworksCallbackUrlGet()
  if (!callbackUrlResult.success) {
    console.error(callbackUrlResult)
    return oidcRequestErrorResponseCreate(op, "Authworks sign-in callback is not configured", 500)
  }

  const returnTo = new URL(request.url).searchParams.get("returnTo")
  const transactionResult = await authworksTransactionCookie.createHeaders(returnTo)
  if (!transactionResult.success) {
    console.error(transactionResult)
    return oidcRequestErrorResponseCreate(op, "could not start Authworks sign-in", 500)
  }

  const discoveryResult = await oidcDiscoveryGet({
    issuer: configResult.data.issuer,
    clientId: configResult.data.clientId,
    clientSecret: configResult.data.clientSecret,
    scopes: [...configResult.data.scopes],
  })
  if (!discoveryResult.success) {
    console.error(discoveryResult)
    return oidcRequestErrorResponseCreate(op, "could not load Authworks configuration", 500)
  }

  const authorizationUrlResult = await oidcAuthorizationUrlCreate({
    config: {
      issuer: configResult.data.issuer,
      clientId: configResult.data.clientId,
      clientSecret: configResult.data.clientSecret,
      scopes: [...configResult.data.scopes],
    },
    discovery: discoveryResult.data,
    redirectUri: callbackUrlResult.data,
    state: transactionResult.data.transaction.state,
    nonce: transactionResult.data.transaction.nonce,
    codeVerifier: transactionResult.data.transaction.codeVerifier,
  })
  if (!authorizationUrlResult.success) {
    console.error(authorizationUrlResult)
    return oidcRequestErrorResponseCreate(op, "could not start Authworks sign-in", 500)
  }

  const headers = new Headers(transactionResult.data.headers)
  headers.set("Location", authorizationUrlResult.data)
  return new Response(null, { status: 302, headers })
}
