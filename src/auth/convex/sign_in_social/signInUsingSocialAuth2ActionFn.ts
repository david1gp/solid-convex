import { internal } from "#convex/_generated/api.js"
import type { ActionCtx } from "#convex/_generated/server.js"
import type { PromiseResult } from "#result"
import type { UserSession } from "#src/auth/model/UserSession.ts"
import { type LoginProvider, loginProvider } from "#src/auth/model_field/socialLoginProvider.ts"
import type { CommonAuthProvider } from "#src/auth/server/social_identity_providers/CommonAuthProvider.ts"
import { socialLoginGetUserProfile } from "#src/auth/server/social_identity_providers/socialLoginGetUserProfile.ts"

export async function signInUsingSocialAuth2ActionFn(
  ctx: ActionCtx,
  provider: Exclude<LoginProvider, typeof loginProvider.oidc>,
  code: string,
): PromiseResult<UserSession> {
  const op = "signInUsingSocialAuth"

  // Download oauth provider data
  const providerInfoOrError = await socialLoginGetUserProfile[provider](code)
  console.log({ op, providerInfoOrError })
  if (!providerInfoOrError.success) {
    console.log("eventFailedLoginAttemptViaSocial", providerInfoOrError.errorMessage)
    return providerInfoOrError
  }
  const providerInfo: CommonAuthProvider = providerInfoOrError.data

  // Find or create user, create token
  return ctx.runMutation(internal.auth.signInUsingSocialAuth3InternalMutation, providerInfo)
}
