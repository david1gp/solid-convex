/** Remove callback credentials synchronously, before the router or analytics starts. */
export function signInCallbackSessionTake(location: Location, history: History): string | null {
  const url = new URL(location.href)
  const fragment = new URLSearchParams(url.hash.slice(1))
  const fragmentSession = fragment.get("userSession")
  const session = fragmentSession ?? url.searchParams.get("userSession")
  if (session === null) return null

  url.searchParams.delete("userSession")
  if (fragmentSession !== null) url.hash = fragment.get("returnHash") ?? ""
  history.replaceState(history.state, "", `${url.pathname}${url.search}${url.hash}`)
  return session
}
