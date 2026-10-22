export type OidcConfig = {
  issuer: string
  clientId: string
  clientSecret?: string
  scopes: readonly string[]
  zitadelOrgId?: string
  authworksOrgId?: string
}

export type OidcProviderKey = "zitadel" | "authworks"
