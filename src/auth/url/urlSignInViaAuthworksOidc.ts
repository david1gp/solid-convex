import { envBaseUrlApiResult } from "#src/app/env/public/envBaseUrlApiResult.ts"
import { apiAuthBasePath } from "#src/auth/api_client/apiAuthBasePath.ts"
import { apiPathAuth } from "#src/auth/url/apiPathAuth.ts"
import { urlSignInRedirectUrl } from "#src/auth/url/urlSignInRedirectUrl.ts"

export function urlSignInViaAuthworksOidc(returnTo = urlSignInRedirectUrl()): string {
  const baseUrlResult = envBaseUrlApiResult()
  if (!baseUrlResult.success) {
    console.error(baseUrlResult.errorMessage)
    return ""
  }

  try {
    const url = new URL(apiAuthBasePath + apiPathAuth.signInViaOidcAuthworks, baseUrlResult.data)
    url.searchParams.set("returnTo", returnTo)
    return url.toString()
  } catch (error) {
    console.error("urlSignInViaAuthworksOidc", error)
    return ""
  }
}
