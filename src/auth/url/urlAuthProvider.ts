import { envGithubClientIdResult } from "#src/app/env/public/envGithubClientIdResult.ts"
import { envGoogleClientIdResult } from "#src/app/env/public/envGoogleClientIdResult.ts"
import { envMicrosoftClientIdResult } from "#src/app/env/public/envMicrosoftClientIdResult.ts"
import {
  loginProvider,
  type SocialLoginProvider,
  socialLoginProvider,
} from "#src/auth/model_field/socialLoginProvider.ts"
import { urlAuthSignInUsingOauth } from "#src/auth/url/urlAuthSignInUsingOauth.ts"

export function urlAuthProvider(provider: SocialLoginProvider, redirectUrl: string = "") {
  return urlOAuthSwitcher(provider, redirectUrl)
}

function urlOAuthSwitcher(provider: SocialLoginProvider, redirectUrl: string = ""): string {
  switch (provider) {
    case socialLoginProvider.github:
      return urlAuthGithub(redirectUrl)
    case socialLoginProvider.google:
      return urlAuthGoogle(redirectUrl)
    case socialLoginProvider.microsoft:
      return urlAuthMicrosoft(redirectUrl)
  }
}

function urlAuthGithub(redirectUrl: string = ""): string {
  const clientIdResult = envGithubClientIdResult()
  if (!clientIdResult.success) {
    return ""
  }
  const clientId = clientIdResult.data
  const rootUrl = "https://github.com/login/oauth/authorize"
  const options = {
    client_id: clientId,
    redirect_uri: urlAuthSignInUsingOauth(socialLoginProvider.github),
    scope: "user:email",
    state: redirectUrl,
  }
  const qs = new URLSearchParams(options)
  return `${rootUrl}?${qs.toString()}`
}

/**
 * https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow#redirecting
 */
function urlAuthGoogle(redirectUrl: string = ""): string {
  const clientIdResult = envGoogleClientIdResult()
  if (!clientIdResult.success) {
    return ""
  }
  const clientId = clientIdResult.data
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth"
  const options = {
    client_id: clientId,
    redirect_uri: urlAuthSignInUsingOauth(socialLoginProvider.google),
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"].join(
      " ",
    ),
    state: redirectUrl,
  }
  const qs = new URLSearchParams(options)
  return `${rootUrl}?${qs.toString()}`
}

export function urlAuthAdmin(userId: string, redirectUrl: string = ""): string {
  const rootUrl = urlAuthSignInUsingOauth(loginProvider.admin)
  const options = {
    code: userId,
    state: redirectUrl,
  }
  const qs = new URLSearchParams(options)
  return `${rootUrl}?${qs.toString()}`
}

function urlAuthMicrosoft(redirectUrl: string = ""): string {
  const clientIdResult = envMicrosoftClientIdResult()
  if (!clientIdResult.success) {
    return ""
  }
  const clientId = clientIdResult.data

  const rootUrl = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"

  const options = {
    client_id: clientId,
    response_type: "code",
    redirect_uri: urlAuthSignInUsingOauth(socialLoginProvider.microsoft),
    scope: "openid profile email offline_access User.Read", // User.Read allows access to /me and profile photo
    state: redirectUrl,
    // Optional: prompt: "select_account" // forces account picker if you want
  }

  const qs = new URLSearchParams(options)
  return `${rootUrl}?${qs.toString()}`
}
