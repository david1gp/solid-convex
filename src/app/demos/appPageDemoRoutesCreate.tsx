import { AppPageDemo } from "#src/app/demos/AppPageDemo.tsx"
import { appPageDemoRoutePathsCreate } from "#src/app/demos/appPageDemoRoutePathsCreate.ts"
import { pageDemoRouteIsMounted } from "#src/app/demos/pageDemoRouteIsMounted.ts"
import { pageRouteInventory } from "#src/app/demos/pageRouteInventory.ts"
import type { RouteObject } from "#ui/demo_pages/RouteConfig.ts"

/** Shell-wrapped twins of every mounted gallery page demo: same fixtures/transport
 * inside AppShell. Generated from the inventory (like pageDemoRoutesCreate) so
 * mounted entries gain twins automatically. */
export function appPageDemoRoutesCreate(): RouteObject[] {
  const detailPaths = appPageDemoRoutePathsCreate()
  const mounted = pageRouteInventory.filter((entry) => pageDemoRouteIsMounted(entry.route))
  return mounted.map((entry, index) => ({
    path: detailPaths[index]!,
    component: () => <AppPageDemo entry={entry} />,
  }))
}
