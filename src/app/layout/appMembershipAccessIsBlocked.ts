import { accessBlocked } from "#src/app/layout/accessUnlocked.ts"
import { invitationAcceptancePathMatches } from "#src/app/layout/invitationAcceptancePathMatches.ts"
import type { UserSession } from "#src/auth/model/UserSession.ts"

export function appMembershipAccessIsBlocked(session: UserSession | undefined | null, pathname: string): boolean {
  if (!session?.profile) return true
  if (invitationAcceptancePathMatches(pathname)) return false
  return accessBlocked(session)
}
