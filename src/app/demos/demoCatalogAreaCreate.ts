/** Top-level catalog area for an inventory app route. Nested org/team/project
 * scope variants group under their leaf area (note > project > team > org). */
export function demoCatalogAreaCreate(route: string): string {
  if (route.includes("/note")) return "Notes"
  if (route.includes("/project")) return "Projects"
  if (route.includes("/team")) return "Teams"
  if (route.startsWith("/org")) return "Organizations"
  if (route.startsWith("/resources")) return "Resources"
  if (route.startsWith("/user-management")) return "User management"
  if (route.startsWith("/profile") || route.startsWith("/u/")) return "Profile"
  if (
    route === "/sign-up" ||
    route === "/sign-up-confirm-email" ||
    route === "/sign-in" ||
    route === "/sign-in-enter-otp" ||
    route === "/sign-in-error" ||
    route === "/sso"
  )
    return "Auth"
  return "Overview"
}
