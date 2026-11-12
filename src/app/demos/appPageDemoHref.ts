import { pageRouteInventory } from "#src/app/demos/pageRouteInventory.ts"

type PageRoute = (typeof pageRouteInventory)[number]["route"]
type PageParams<R extends PageRoute> = {
  [K in keyof Extract<(typeof pageRouteInventory)[number], { route: R }>["params"]]?: string
}

/** Shell-wrapped twin of pageDemoHref: same sample-param filling under /demos/app. */
export function appPageDemoHref<R extends PageRoute>(route: R, params?: PageParams<R>): string {
  const entry = pageRouteInventory.find((item) => item.route === route)
  if (!entry) return "/demos"
  if (route === "/") return "/demos/app/root"

  const values: Record<string, string> = { ...entry.params, ...params }
  return `/demos/app${route.replace(/:([^/]+)/g, (_, key: string) => encodeURIComponent(values[key] ?? ""))}`
}
