import { apiAuthBasePath } from "#src/auth/api_client/apiAuthBasePath.ts"
import { addRouteWithCors } from "#src/auth/convex/headers/cors/addRouteWithCors.ts"
import type { HonoDispatcher } from "#src/auth/convex/headers/honoDispatcher.ts"
import { httpMethod } from "#src/auth/convex/headers/httpMethod.ts"
import { signInViaEmail1RequestHandler } from "#src/auth/convex/sign_in_email/signInViaEmail1RequestHandler.ts"
import { signInViaEmailEnterOtp1RequestHandler } from "#src/auth/convex/sign_in_email/signInViaEmailEnterOtp1RequestHandler.ts"
import { signInViaOidcCallbackRequestHandler } from "#src/auth/convex/sign_in_oidc/signInViaOidcCallbackRequestHandler.ts"
import { signInViaOidcStartRequestHandler } from "#src/auth/convex/sign_in_oidc/signInViaOidcStartRequestHandler.ts"
import { signInViaPw1RequestHandler } from "#src/auth/convex/sign_in_pw/signInViaPw1RequestHandler.ts"
import { signInUsingSocialAuth1RequestHandler } from "#src/auth/convex/sign_in_social/signInUsingSocialAuth1RequestHandler.ts"
import { signUp1RequestHandler } from "#src/auth/convex/sign_up/signUp1RequestHandler.ts"
import { signUpConfirmEmail1RequestHandler } from "#src/auth/convex/sign_up/signUpConfirmEmail1RequestHandler.ts"
import { userDelete1RequestHandler } from "#src/auth/convex/user/delete/userDelete1RequestHandler.ts"
import { userEmailChange1RequestHandler } from "#src/auth/convex/user/email_change/userEmailChange1RequestHandler.ts"
import { userEmailChange2ConfirmHandler } from "#src/auth/convex/user/email_change/userEmailChange2ConfirmHandler.ts"
import { userProfileUpdate1RequestHandler } from "#src/auth/convex/user/profile_update/userProfileUpdate1RequestHandler.ts"
import { userPasswordChange1RequestHandler } from "#src/auth/convex/user/pw_change/userPasswordChange1RequestHandler.ts"
import { userPasswordChange2ConfirmHandler } from "#src/auth/convex/user/pw_change/userPasswordChange2ConfirmHandler.ts"
import { loginProvider, socialLoginProvider } from "#src/auth/model_field/socialLoginProvider.ts"
import { apiPathAuth } from "#src/auth/url/apiPathAuth.ts"

export function addHttpRoutesAuth(dispatcher: HonoDispatcher) {
  // Oauth / GitHub
  addRouteWithCors(dispatcher, apiAuthBasePath + apiPathAuth.signInViaGithub, httpMethod.GET, async (ctx, request) => {
    return signInUsingSocialAuth1RequestHandler(socialLoginProvider.github, ctx, request)
  })
  // Oauth / Google
  addRouteWithCors(dispatcher, apiAuthBasePath + apiPathAuth.signInViaGoogle, httpMethod.GET, async (ctx, request) => {
    return signInUsingSocialAuth1RequestHandler(socialLoginProvider.google, ctx, request)
  })
  // Generic OpenID Connect (Zitadel)
  addRouteWithCors(
    dispatcher,
    apiAuthBasePath + apiPathAuth.signInViaOidc,
    httpMethod.GET,
    signInViaOidcStartRequestHandler,
  )
  addRouteWithCors(
    dispatcher,
    apiAuthBasePath + apiPathAuth.signInViaOidcCallback,
    httpMethod.GET,
    signInViaOidcCallbackRequestHandler,
  )
  // Generic OpenID Connect (Authworks second provider slot)
  addRouteWithCors(
    dispatcher,
    apiAuthBasePath + apiPathAuth.signInViaOidcAuthworks,
    httpMethod.GET,
    async (ctx, request) => signInViaOidcStartRequestHandler(ctx, request, "authworks"),
  )
  addRouteWithCors(
    dispatcher,
    apiAuthBasePath + apiPathAuth.signInViaOidcAuthworksCallback,
    httpMethod.GET,
    async (ctx, request) => signInViaOidcCallbackRequestHandler(ctx, request, "authworks"),
  )
  // Oauth / Admin
  addRouteWithCors(dispatcher, apiAuthBasePath + apiPathAuth.signInViaAdmin, httpMethod.GET, async (ctx, request) => {
    return signInUsingSocialAuth1RequestHandler(loginProvider.admin, ctx, request)
  })

  // Sign up routes
  addRouteWithCors(dispatcher, apiAuthBasePath + apiPathAuth.signUp, httpMethod.POST, signUp1RequestHandler)
  // Sign up confirm email routes
  addRouteWithCors(
    dispatcher,
    apiAuthBasePath + apiPathAuth.signUpConfirmEmail,
    httpMethod.POST,
    signUpConfirmEmail1RequestHandler,
  )

  // Sign in via password routes
  addRouteWithCors(dispatcher, apiAuthBasePath + apiPathAuth.signInViaPw, httpMethod.POST, signInViaPw1RequestHandler)
  // Sign in via email routes
  addRouteWithCors(
    dispatcher,
    apiAuthBasePath + apiPathAuth.signInViaEmail,
    httpMethod.POST,
    signInViaEmail1RequestHandler,
  )

  // Sign in via email enter OTP routes
  addRouteWithCors(
    dispatcher,
    apiAuthBasePath + apiPathAuth.signInViaEmailEnterOtp,
    httpMethod.POST,
    signInViaEmailEnterOtp1RequestHandler,
  )
  // Profile actions
  addHttpRoutesAuthProfile(dispatcher)

  // Is online routes
  addRouteWithCors(dispatcher, "/api/isOnline", httpMethod.GET, async () => {
    return new Response("OK")
  })
  return dispatcher
}

function addHttpRoutesAuthProfile(dispatcher: HonoDispatcher) {
  // Update profile routes
  addRouteWithCors(
    //
    dispatcher,
    apiAuthBasePath + apiPathAuth.profileUpdate,
    httpMethod.POST,
    userProfileUpdate1RequestHandler,
  )
  // Change password routes
  addRouteWithCors(
    dispatcher,
    apiAuthBasePath + apiPathAuth.passwordChangeRequest,
    httpMethod.POST,
    userPasswordChange1RequestHandler,
  )
  addRouteWithCors(
    dispatcher,
    apiAuthBasePath + apiPathAuth.passwordChangeConfirm,
    httpMethod.POST,
    userPasswordChange2ConfirmHandler,
  )
  // Change email routes
  addRouteWithCors(
    //
    dispatcher,
    apiAuthBasePath + apiPathAuth.emailChangeRequest,
    httpMethod.POST,
    userEmailChange1RequestHandler,
  )
  // Change email confirm routes
  addRouteWithCors(
    //
    dispatcher,
    apiAuthBasePath + apiPathAuth.emailChangeConfirm,
    httpMethod.POST,
    userEmailChange2ConfirmHandler,
  )
  // Delete user routes
  addRouteWithCors(dispatcher, apiAuthBasePath + apiPathAuth.userDelete, httpMethod.POST, userDelete1RequestHandler)
}
