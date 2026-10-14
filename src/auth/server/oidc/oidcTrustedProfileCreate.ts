import { loginProvider } from "#src/auth/model_field/socialLoginProvider.ts"
import type { UserRole } from "#src/auth/model_field/userRole.ts"
import type { OidcIdTokenClaims } from "#src/auth/server/oidc/oidcIdTokenClaimsSchema.ts"
import type { CommonAuthProvider } from "#src/auth/server/social_identity_providers/CommonAuthProvider.ts"

export function oidcTrustedProfileCreate(
  claims: OidcIdTokenClaims,
  role?: UserRole,
  userInfo?: { name?: string; picture?: string },
  roles?: UserRole[],
): Extract<CommonAuthProvider, { provider: typeof loginProvider.oidc }> {
  const givenName = claims.given_name?.trim()
  const fullName = claims.name?.trim() || userInfo?.name?.trim()
  const tokenPicture = claims.picture?.trim() ? claims.picture : undefined
  return {
    provider: loginProvider.oidc,
    issuer: claims.iss,
    providerId: claims.sub,
    givenName: givenName || fullName || "",
    familyName: givenName || !fullName ? (claims.family_name ?? "") : "",
    image: tokenPicture ?? userInfo?.picture ?? "",
    username: claims.preferred_username ?? "",
    ...(claims.email_verified === true && claims.email ? { email: claims.email } : {}),
    ...(role !== undefined ? { role } : {}),
    ...(roles !== undefined ? { roles } : {}),
  }
}
