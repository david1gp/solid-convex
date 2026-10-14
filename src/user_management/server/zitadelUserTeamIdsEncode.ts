export function zitadelUserTeamIdsEncode(teamIds: readonly string[]): Uint8Array {
  const serialized = JSON.stringify(teamIds)
  return new TextEncoder().encode(serialized)
}
