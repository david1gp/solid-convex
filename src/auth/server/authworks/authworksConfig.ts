export type AuthworksConfig = {
  issuer: string
  clientId: string
  clientSecret?: string
  scopes: readonly string[]
  authworksOrgId?: string
}
