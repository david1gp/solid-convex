import type { UserSession } from "#src/auth/model/UserSession.ts"

const log = false

export function accessUnlocked(session: UserSession | undefined | null): boolean {
  if (!session?.profile) {
    if (log) console.info("!session", "-> access blocked")
    return false
  }
  return true
}

export function accessBlocked(session: UserSession | undefined | null): boolean {
  return !accessUnlocked(session)
}
