export function oidcZitadelRawRolesExtract(claims: Record<string, unknown>, projectId?: string): unknown {
  if (projectId) {
    const projectKey = `urn:zitadel:iam:org:project:${projectId}:roles`
    if (claims[projectKey] !== undefined) return claims[projectKey]
  }
  if (claims["urn:zitadel:iam:org:project:roles"] !== undefined) {
    return claims["urn:zitadel:iam:org:project:roles"]
  }
  for (const [key, value] of Object.entries(claims)) {
    if (key.startsWith("urn:zitadel:iam:org:project:") && key.endsWith(":roles") && value !== undefined) {
      return value
    }
  }
  return undefined
}
