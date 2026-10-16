import { pageDemoHref } from "#src/app/demos/pageDemoHref.ts"
import { pageRouteInventory } from "#src/app/demos/pageRouteInventory.ts"
import type { DemoListType } from "#ui/generate_demo_list/DemoListType.ts"

export function demoCatalogDataCreate(demoList: DemoListType) {
  return {
    componentCategories: Object.entries(demoList).map(([category, demos]) => ({
      category,
      demos: Object.keys(demos),
    })),
    pageDemos: pageRouteInventory.map((entry) => ({
      title: entry.title,
      route: entry.route,
      href: pageDemoHref(entry.route),
    })),
  }
}
