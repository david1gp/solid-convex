/** A readable default for every route, including routes without their own title. */
export function routePageTitle(path: string): string {
  const parts = path.split("/").filter((part) => part && !part.startsWith(":") && part !== "*")
  const segment = parts.at(-1) ?? "Overview"
  const label = segment.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[-_]/g, " ")
  return `${label.charAt(0).toUpperCase()}${label.slice(1)} · Solid Convex`
}
