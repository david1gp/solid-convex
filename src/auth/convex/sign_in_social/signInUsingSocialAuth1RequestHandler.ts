import type { ActionCtx } from "#convex/_generated/server.js"
import { createResultError } from "#result"
import { apiError } from "#src/api/apiError.ts"
import { enableGithub } from "#src/app/config/enableGithub.ts"
import { enableSignInAdmin } from "#src/app/config/enableSignInAdmin.ts"
import { signInCallbackCompletionResponseCreate } from "#src/auth/convex/sign_in_shared/signInCallbackCompletionResponseCreate.ts"
import { signInUsingSocialAuth2ActionFn } from "#src/auth/convex/sign_in_social/signInUsingSocialAuth2ActionFn.ts"
import type { UserSession } from "#src/auth/model/UserSession.ts"
import { type LoginProvider, loginProvider } from "#src/auth/model_field/socialLoginProvider.ts"
import { getDefaultUrlSignedIn } from "#src/auth/url/getDefaultUrlSignedIn.ts"

export async function signInUsingSocialAuth1RequestHandler(
  provider: Exclude<LoginProvider, typeof loginProvider.oidc>,
  ctx: ActionCtx,
  request: Request,
): Promise<Response> {
  const op = "signInUsingSocialAuth1RequestHandler"
  const url = new URL(request.url)
  const error = url.searchParams.get("error")
  if (error) {
    const errorMessage = `oauth returned error value: ${error}`
    const err = createResultError(op, errorMessage)
    console.warn(err)
    return apiError.fromResultError("auth.bad-request", err)
  }

  if (provider === loginProvider.github && !enableGithub()) {
    const errorMessage = "Github provider disabled"
    const err = createResultError(op, errorMessage)
    console.warn(err)
    return apiError.fromResultError("auth.bad-request", err)
  }

  if (provider === loginProvider.admin && !enableSignInAdmin()) {
    const errorMessage = "Admin provider disabled"
    const err = createResultError(op, errorMessage)
    console.warn(err)
    return apiError.fromResultError("auth.bad-request", err)
  }

  const code = url.searchParams.get("code")
  if (!code || code?.length <= 1) {
    const errorMessage = "missing code"
    const err = createResultError(op, errorMessage)
    console.warn(err)
    return apiError.fromResultError("auth.bad-request", err)
  }

  const tokenResult = await signInUsingSocialAuth2ActionFn(ctx, provider, code)
  if (!tokenResult.success) {
    console.warn(tokenResult)
    return apiError.fromResultError("auth.bad-request", tokenResult)
  }
  const userSession: UserSession = tokenResult.data

  const defaultStartPage = getDefaultUrlSignedIn()
  const state = url.searchParams.get("state") || defaultStartPage
  return signInCallbackCompletionResponseCreate(ctx, userSession, state, "oauth")
}
