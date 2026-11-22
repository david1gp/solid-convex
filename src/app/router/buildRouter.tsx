import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/solid-router"
import type { Component, Element as JSXElement } from "solid-js"
import { NotFoundPage } from "#src/app/router/NotFoundPage.tsx"
import { routePageTitle } from "#src/app/router/routePageTitle.ts"

/**
 * Loose route-tree node — the shape produced by the app's `getRoutes*()` helpers.
 * Either a leaf (`path` + `component`) or a pathless layout (`component` wrapping
 * `children`, no own `path`). Mirrors the old @solidjs/router config so the route
 * definition files need no changes.
 */
export type RouteNode = {
  path?: string
  component?: Component<any> | (() => JSXElement)
  children?: RouteNode[]
}

/**
 * Converts a @solidjs/router path pattern to the TanStack equivalent:
 *  - `:param`  -> `$param`
 *  - `*` splat -> `$`
 *  - leading `/` stripped (TanStack child paths are relative; the parent is the
 *    root or a pathless layout whose fullPath is `/`), except the index `/`.
 */
function normalizePath(path: string): string {
  const p = path.replace(/:([A-Za-z0-9_]+)/g, "$$$1").replace(/\*/g, "$")
  if (p === "/") return "/"
  return p.replace(/^\//, "")
}

let pathlessCounter = 0

function buildRoute(parentRoute: any, node: RouteNode): any {
  const hasChildren = !!node.children?.length
  const Comp = node.component
  const options: any = { getParentRoute: () => parentRoute }

  if (node.path != null) {
    options.path = normalizePath(node.path)
  } else {
    // pathless layout route — needs a stable id
    options.id = `layout-${pathlessCounter++}`
  }

  if (hasChildren && Comp) {
    options.component = () => <Comp>{<Outlet />}</Comp>
  } else if (hasChildren) {
    options.component = () => <Outlet />
  } else if (Comp) {
    options.component = () => {
      document.title = routePageTitle(node.path ?? "/")
      return <Comp />
    }
  }

  const route = createRoute(options)
  if (hasChildren) {
    route.addChildren(node.children!.map((child) => buildRoute(route, child)))
  }
  return route
}

/**
 * Builds a TanStack router from the app's code-based route config (the same
 * nested `{ path, component, children }` arrays previously passed to
 * @solidjs/router's `<Router>`).
 */
export function buildRouter(routes: RouteNode[]) {
  pathlessCounter = 0
  const rootRoute = createRootRoute({ component: () => <Outlet /> })
  const routeTree = rootRoute.addChildren(routes.map((route) => buildRoute(rootRoute, route)))
  return createRouter({
    routeTree,
    defaultNotFoundComponent: NotFoundPage,
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadDelay: 0,
  })
}
