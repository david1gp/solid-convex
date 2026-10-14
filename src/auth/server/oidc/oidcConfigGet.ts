import { createResult, createResultError, type Result } from "#result"
import { envVariableErrorMessage } from "#src/app/env/envVariableErrorMessage.ts"
import { privateEnvVariableName } from "#src/app/env/privateEnvVariableName.ts"
import type { OidcConfig } from "#src/auth/server/oidc/oidcConfig.ts"

const oidcDefaultScopes = ["openid", "profile", "email"] as const
const oidcZitadelRoleScopes = [
  "urn:zitadel:iam:org:project:roles",
  "urn:zitadel:iam:org:project:role:user",
  "urn:zitadel:iam:org:project:role:member",
  "urn:zitadel:iam:org:project:role:admin",
] as const
const oidcScopeCharacterPattern = /^[\u0021\u0023-\u005B\u005D-\u007E]+$/u

export function oidcConfigGet(): Result<OidcConfig> {
  const op = "oidcConfigGet"
  const issuer = process.env[privateEnvVariableName.OIDC_ISSUER]?.trim()
  if (!issuer) return createResultError(op, envVariableErrorMessage(privateEnvVariableName.OIDC_ISSUER))
  if (!oidcHttpsUrlIsValid(issuer)) return createResultError(op, "invalid OIDC_ISSUER")

  const clientId = process.env[privateEnvVariableName.OIDC_CLIENT_ID]?.trim()
  if (!clientId) return createResultError(op, envVariableErrorMessage(privateEnvVariableName.OIDC_CLIENT_ID))

  const scopeText = process.env[privateEnvVariableName.OIDC_SCOPES]
  const scopes = scopeText === undefined ? [...oidcDefaultScopes] : scopeText.trim().split(/\s+/u)
  if (
    scopes.length === 0 ||
    scopes.some((scope) => !scope || !oidcScopeCharacterPattern.test(scope)) ||
    !scopes.includes("openid")
  ) {
    return createResultError(op, "invalid OIDC_SCOPES")
  }

  const clientSecret = process.env[privateEnvVariableName.OIDC_CLIENT_SECRET] || undefined
  const zitadelOrgId = process.env[privateEnvVariableName.OIDC_ZITADEL_ORG_ID]?.trim() || undefined
  if (zitadelOrgId && !/^\d+$/u.test(zitadelOrgId)) return createResultError(op, "invalid OIDC_ZITADEL_ORG_ID")
  const configuredScopes = zitadelOrgId ? [...scopes, ...oidcZitadelRoleScopes] : scopes
  const zitadelProjectId = process.env.ZITADEL_PROJECT_ID?.trim()
  if (zitadelProjectId) configuredScopes.push(`urn:zitadel:iam:org:project:id:${zitadelProjectId}:roles`)
  return createResult({
    issuer,
    clientId,
    clientSecret,
    scopes: [...new Set(configuredScopes)],
    ...(zitadelOrgId ? { zitadelOrgId } : {}),
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
