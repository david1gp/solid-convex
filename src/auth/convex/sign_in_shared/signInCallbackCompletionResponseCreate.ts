import { internal } from "#convex/_generated/api.js"
import type { ActionCtx } from "#convex/_generated/server.js"
import { createResult, createResultError } from "#result"
import { envBaseUrlAppResult } from "#src/app/env/public/envBaseUrlAppResult.ts"
import type { UserSession } from "#src/auth/model/UserSession.ts"
import { getDefaultUrlSignedIn } from "#src/auth/url/getDefaultUrlSignedIn.ts"
import { jsonStringifyPretty } from "#utils/json/jsonStringifyPretty.js"
import { base64urlEncodeObject } from "#utils/url/base64url.js"

export async function signInCallbackCompletionResponseCreate(
  ctx: ActionCtx,
  userSession: UserSession,
  returnTo: string,
  operationName: string,
  additionalHeaders?: Headers,
): Promise<Response> {
  const op = "signInCallbackCompletionResponseCreate"
  const headers = new Headers(additionalHeaders)
  const userSessionSerializedResult = base64urlEncodeObject(userSession)
  if (!userSessionSerializedResult.success) {
    console.warn(userSessionSerializedResult)
    return new Response(jsonStringifyPretty(userSessionSerializedResult), { status: 500, headers })
  }

  const appUrlResult = envBaseUrlAppResult()
  if (!appUrlResult.success) {
    console.error(appUrlResult)
    return new Response(jsonStringifyPretty(appUrlResult), { status: 500, headers })
  }

  const redirectUrlResult = signInCallbackRedirectUrlCreate(appUrlResult.data, returnTo)
  if (!redirectUrlResult.success) {
    console.error(redirectUrlResult)
    return new Response(jsonStringifyPretty(redirectUrlResult), { status: 500, headers })
  }
  const redirectUrl = redirectUrlResult.data
  redirectUrl.searchParams.delete("userSession")
  const fragment = new URLSearchParams({ userSession: userSessionSerializedResult.data })
  if (redirectUrl.hash) fragment.set("returnHash", redirectUrl.hash)
  redirectUrl.hash = fragment.toString()

  console.log("user signed in", { redirectPath: redirectUrl.pathname })
  try {
    await ctx.scheduler.runAfter(0, internal.auth.notifyTelegramAuthInternalAction, {
      userSession,
      operationName,
    })
  } catch (error) {
    console.warn(op, "could not schedule auth notification", error)
  }

  headers.set("Location", redirectUrl.toString())
  return new Response(null, { status: 302, headers })
}

function signInCallbackRedirectUrlCreate(hostnameApp: string, returnTo: string) {
  const op = "signInCallbackRedirectUrlCreate"
  let appUrl: URL
  try {
    appUrl = new URL(hostnameApp)
  } catch {
    return createResultError(op, "invalid application URL")
  }

  const safeReturnTo = signInCallbackReturnToGet(returnTo)
  try {
    const redirectUrl = new URL(safeReturnTo, appUrl)
    if (redirectUrl.origin !== appUrl.origin) return createResultError(op, "invalid callback redirect URL")
    return createResult(redirectUrl)
  } catch {
    return createResultError(op, "invalid callback redirect URL")
  }
}

function signInCallbackReturnToGet(returnTo: string): string {
  if (!signInCallbackReturnToIsSafe(returnTo)) return getDefaultUrlSignedIn()
  return returnTo
}

function signInCallbackReturnToIsSafe(returnTo: string): boolean {
  if (!returnTo?.startsWith("/") || returnTo.startsWith("//") || returnTo.includes("\\")) return false
  for (const character of returnTo) {
    const code = character.codePointAt(0) ?? 0
    if (code <= 31 || code === 127) return false
  }
  return true
}
