import { createResult, createResultError, type Result } from "#result"
import type { OidcIdTokenClaims } from "#src/auth/server/oidc/oidcIdTokenClaimsSchema.ts"

/**
 * Admits an Authworks identity. When `AUTHWORKS_ORGANIZATION_ID` is configured,
 * the `urn:zitadel:iam:user:resourceowner:id` claim must match it; a missing
 * claim then denies access (fail closed — Authworks omits the claim for users
 * with zero or multiple active organization memberships). When no organization
 * is configured, the verified Authworks realm issuer is the trust boundary.
 * Authworks issues no role claims, so this check never grants admin rights.
 */
export function oidcAuthworksAdmissionCheck(
  claims: OidcIdTokenClaims,
  organizationId: string | undefined,
): Result<void> {
  const op = "oidcAuthworksAdmissionCheck"
  const expected = organizationId?.trim() || ""
  if (!expected) return createResult(undefined)
  const admitted = claims["urn:zitadel:iam:user:resourceowner:id"]?.trim() === expected
  if (!admitted) return createResultError(op, "The identity is not a member of the trusted Authworks organization")
  return createResult(undefined)
}
