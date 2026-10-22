import { createResult, createResultError, type Result } from "#result"
import { privateEnvVariableName } from "#src/app/env/privateEnvVariableName.ts"
import { envBaseUrlApiResult } from "#src/app/env/public/envBaseUrlApiResult.ts"
import { apiAuthBasePath } from "#src/auth/api_client/apiAuthBasePath.ts"
import { apiPathAuth } from "#src/auth/url/apiPathAuth.ts"

export function authworksCallbackUrlGet(): Result<string> {
  const op = "authworksCallbackUrlGet"
  const configured = process.env[privateEnvVariableName.AUTHWORKS_REDIRECT_URI]?.trim()
  if (configured) {
    try {
      const redirect = new URL(configured)
      if (!authworksCallbackUrlIsValid(redirect)) return createResultError(op, "invalid AUTHWORKS_REDIRECT_URI")
      return createResult(redirect.toString())
    } catch {
      return createResultError(op, "invalid AUTHWORKS_REDIRECT_URI")
    }
  }

  const baseUrlResult = envBaseUrlApiResult()
  if (!baseUrlResult.success) return baseUrlResult

  try {
    const callbackUrl = new URL(apiAuthBasePath + apiPathAuth.signInViaAuthworksCallback, baseUrlResult.data)
    if (!authworksCallbackUrlIsValid(callbackUrl)) return createResultError(op, "invalid Authworks callback URL")
    return createResult(callbackUrl.toString())
  } catch {
    return createResultError(op, "invalid Authworks callback URL")
  }
}

function authworksCallbackUrlIsValid(value: URL): boolean {
  return (
    (value.protocol === "https:" || value.protocol === "http:") &&
    !value.username &&
    !value.password &&
    !value.search &&
    !value.hash
  )
}
