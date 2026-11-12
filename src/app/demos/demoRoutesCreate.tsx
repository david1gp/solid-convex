import { appPageDemoRoutesCreate } from "#src/app/demos/appPageDemoRoutesCreate.tsx"
import { DemoCatalog } from "#src/app/demos/DemoCatalog.tsx"
import { demoList } from "#src/app/demos/demoList.ts"
import { DemoShell } from "#src/app/layout/DemoShell.tsx"
import { pageDemoRoutesCreate } from "#src/app/demos/pageDemoRoutesCreate.tsx"
import { NavDemo } from "#src/app/nav/NavDemo.tsx"
import type { RouteNode } from "#src/app/router/buildRouter.tsx"
import { generateDemoRoutes } from "#ui/demo_pages/generateDemoRoutes.tsx"

/** Combines page-detail and generated component routes without category or splat collisions. */
export function demoRoutesCreate(): RouteNode[] {
  const pageRoutes = pageDemoRoutesCreate()
  const appPageRoutes = appPageDemoRoutesCreate()
  const pagePaths = new Set([...pageRoutes, ...appPageRoutes].map(({ path }) => path))
  const componentRoutes = generateDemoRoutes(demoList, "/demos", NavDemo).filter(
    ({ path }) => path !== "/demos" && path !== "/demos/*" && !pagePaths.has(path),
  )

  return [
    ...pageRoutes,
    ...appPageRoutes,
    { path: "/demos/shell", component: DemoShell },
    { path: "/demos", component: DemoCatalog },
    {
      path: "/demos/pages",
      component: () => (
        <main>
          <h1>Page demo not found</h1>
          <a href="/demos">Back to demos</a>
        </main>
      ),
    },
    ...componentRoutes,
  ]
}
