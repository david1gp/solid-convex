import { createResult, createResultError, type Result } from "#result"
import { envVariableErrorMessage } from "#src/app/env/envVariableErrorMessage.ts"
import { privateEnvVariableName } from "#src/app/env/privateEnvVariableName.ts"
import type { AuthworksConfig } from "#src/auth/server/authworks/authworksConfig.ts"

const authworksDefaultScopes = ["openid", "profile", "email"] as const
const authworksZitadelRoleScopes = [
  "urn:zitadel:iam:org:project:roles",
  "urn:zitadel:iam:org:project:role:user",
  "urn:zitadel:iam:org:project:role:member",
  "urn:zitadel:iam:org:project:role:admin",
] as const
const authworksScopeCharacterPattern = /^[\u0021\u0023-\u005B\u005D-\u007E]+$/u
const authworksOrganizationIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu

export function authworksConfigGet(): Result<AuthworksConfig> {
  const op = "authworksConfigGet"
  const issuer = process.env[privateEnvVariableName.AUTHWORKS_ISSUER]?.trim()
  if (!issuer) return createResultError(op, envVariableErrorMessage(privateEnvVariableName.AUTHWORKS_ISSUER))
  if (!authworksHttpsUrlIsValid(issuer)) return createResultError(op, "invalid AUTHWORKS_ISSUER")

  const clientId = process.env[privateEnvVariableName.AUTHWORKS_CLIENT_ID]?.trim()
  if (!clientId) return createResultError(op, envVariableErrorMessage(privateEnvVariableName.AUTHWORKS_CLIENT_ID))

  const scopeText = process.env[privateEnvVariableName.AUTHWORKS_SCOPE]
  const scopes = scopeText === undefined ? [...authworksDefaultScopes] : scopeText.trim().split(/\s+/u)
  if (
    scopes.length === 0 ||
    scopes.some((scope) => !scope || !authworksScopeCharacterPattern.test(scope)) ||
    !scopes.includes("openid")
  ) {
    return createResultError(op, "invalid AUTHWORKS_SCOPE")
  }

  const clientSecret = process.env[privateEnvVariableName.AUTHWORKS_CLIENT_SECRET] || undefined
  const authworksOrgId = process.env[privateEnvVariableName.AUTHWORKS_ORGANIZATION_ID]?.trim() || undefined
  if (authworksOrgId && !authworksOrganizationIdPattern.test(authworksOrgId)) {
    return createResultError(op, "invalid AUTHWORKS_ORGANIZATION_ID")
  }
  const configuredScopes = authworksOrgId ? [...scopes, ...authworksZitadelRoleScopes] : scopes
  const zitadelProjectId = process.env.ZITADEL_PROJECT_ID?.trim()
  if (zitadelProjectId) configuredScopes.push(`urn:zitadel:iam:org:project:id:${zitadelProjectId}:roles`)
  return createResult({
    issuer,
    clientId,
    clientSecret,
    scopes: [...new Set(configuredScopes)],
    ...(authworksOrgId ? { authworksOrgId } : {}),
  })
}

function authworksHttpsUrlIsValid(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === "https:" && !url.username && !url.password && !url.search && !url.hash
  } catch {
    return false
  }
}
