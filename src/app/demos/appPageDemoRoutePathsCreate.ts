import { pageDemoRouteIsMounted } from "#src/app/demos/pageDemoRouteIsMounted.ts"
import { pageRouteInventory } from "#src/app/demos/pageRouteInventory.ts"

/** One /demos/app twin path per mounted gallery entry; unmounted entries get no twin. */
export function appPageDemoRoutePathsCreate(): string[] {
  return pageRouteInventory
    .filter((entry) => pageDemoRouteIsMounted(entry.route))
    .map(({ route }) => `/demos/app${route === "/" ? "/root" : route}`)
}
