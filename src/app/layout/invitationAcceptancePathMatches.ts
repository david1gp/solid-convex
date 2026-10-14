export function invitationAcceptancePathMatches(pathname: string): boolean {
  return /^\/org\/[^/]+\/invitations\/[^/]+\/accept\/?$/.test(pathname)
}
