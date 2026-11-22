import * as a from "valibot"
import { createResult, createResultError, type Result } from "#result"
import { type UserSession, userSessionSchema } from "#src/auth/model/UserSession.ts"
import { signInSessionNew } from "#src/auth/ui/sign_in/logic/signInSessionNew.ts"
import { pageRouteAuth } from "#src/auth/url/pageRouteAuth.ts"
import { navigateTo } from "#src/utils/router/navigateTo.ts"
import { base64urlDecodeObject } from "#utils/url/base64url.js"

export function signInLogic(userSessionString: string | null): void {
  const op = "signInLogic"

  if (!userSessionString) {
    // do nothing, user should choose sign up/in method
    return
  }

  try {
    const signedIn = signedInLogicResult(userSessionString)
    if (!signedIn.success) {
      const errorMessage = signedIn.errorMessage || "Unknown error"
      navigateToErrorPage(op, errorMessage)
    } else {
      // success, userSession is set -> LayoutWrapper should router switch to a different route
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
    navigateToErrorPage(op, errorMessage)
  }
}

export function navigateToErrorPage(op: string, errorMessage: string, error?: unknown): void {
  console.error(op, "errorMessage:", errorMessage, "error:", error)
  navigateTo(`${pageRouteAuth.signInError}?errorMessage=${encodeURIComponent(errorMessage)}`)
}

function signedInLogicResult(userSessionString: string): Result<UserSession> {
  const op = "signedInLogic"
  // decode session
  const decodedUserSessionObjectResult = base64urlDecodeObject(userSessionString)
  if (!decodedUserSessionObjectResult.success) return decodedUserSessionObjectResult
  // parse session
  const parsingResult = a.safeParse(userSessionSchema, decodedUserSessionObjectResult.data)
  if (!parsingResult.success)
    return createResultError(
      op,
      a.summarize(parsingResult.issues),
      JSON.stringify(decodedUserSessionObjectResult.data, null, 2),
    )
  const newSession: UserSession = parsingResult.output
  signInSessionNew(newSession)
  return createResult(newSession)
}
