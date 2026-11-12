import { appShellNavigation } from "#src/app/layout/appShellNavigation.ts"
import { pageDemoHref } from "#src/app/demos/pageDemoHref.ts"
import { pageRouteInventory } from "#src/app/demos/pageRouteInventory.ts"

/** Resolves a page-demo inventory route to the sidebar nav href the real shell would
 * highlight for it (same prefix-match + nav[0] fallback as appShellStateCreate). */
export function appPageDemoActiveHrefCreate(route: (typeof pageRouteInventory)[number]["route"]): string {
  const samplePath = route === "/" ? "/" : pageDemoHref(route).replace(/^\/demos/, "")
  const navigation = appShellNavigation()
  return (
    navigation.find((item) => samplePath === item.href || samplePath.startsWith(`${item.href}/`))?.href ??
    navigation[0]!.href
  )
}
