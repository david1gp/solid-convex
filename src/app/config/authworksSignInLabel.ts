const defaultAuthworksSignInLabel = "Sign in with Authworks"

export function authworksSignInLabel(): string {
  const label = process.env.PUBLIC_AUTHWORKS_LABEL?.trim()
  return label || defaultAuthworksSignInLabel
}
