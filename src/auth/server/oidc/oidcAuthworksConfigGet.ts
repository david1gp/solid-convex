import { createResult, createResultError, type Result } from "#result"
import { envVariableErrorMessage } from "#src/app/env/envVariableErrorMessage.ts"
import { privateEnvVariableName } from "#src/app/env/privateEnvVariableName.ts"
import type { OidcConfig } from "#src/auth/server/oidc/oidcConfig.ts"

const authworksDefaultScopes = ["openid", "profile", "email"] as const
const oidcScopeCharacterPattern = /^[\u0021\u0023-\u005B\u005D-\u007E]+$/u

export function oidcAuthworksConfigGet(): Result<OidcConfig> {
  const op = "oidcAuthworksConfigGet"
  const issuer = process.env[privateEnvVariableName.AUTHWORKS_ISSUER]?.trim() || "https://authworks.contentoren.de"
  if (!oidcHttpsUrlIsValid(issuer)) return createResultError(op, "invalid AUTHWORKS_ISSUER")

  const clientId = process.env[privateEnvVariableName.AUTHWORKS_CLIENT_ID]?.trim()
  if (!clientId) return createResultError(op, envVariableErrorMessage(privateEnvVariableName.AUTHWORKS_CLIENT_ID))

  const scopeText = process.env[privateEnvVariableName.AUTHWORKS_SCOPES]
  const scopes = scopeText === undefined ? [...authworksDefaultScopes] : scopeText.trim().split(/\s+/u)
  if (
    scopes.length === 0 ||
    scopes.some((scope) => !scope || !oidcScopeCharacterPattern.test(scope)) ||
    !scopes.includes("openid")
  ) {
    return createResultError(op, "invalid AUTHWORKS_SCOPES")
  }

  const clientSecret = process.env[privateEnvVariableName.AUTHWORKS_CLIENT_SECRET] || undefined
  const authworksOrgId = process.env[privateEnvVariableName.AUTHWORKS_ORGANIZATION_ID]?.trim() || undefined
  if (
    authworksOrgId &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(authworksOrgId)
  ) {
    return createResultError(op, "invalid AUTHWORKS_ORGANIZATION_ID")
  }
  return createResult({
    issuer,
    clientId,
    clientSecret,
    scopes: [...new Set(scopes)],
    ...(authworksOrgId ? { authworksOrgId } : {}),
  })
}

function oidcHttpsUrlIsValid(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === "https:" && !url.username && !url.password && !url.search && !url.hash
  } catch {
    return false
  }
}
