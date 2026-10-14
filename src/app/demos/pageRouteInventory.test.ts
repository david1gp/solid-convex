import { describe, expect, test } from "bun:test"
import { pageDemoRouteIsMounted } from "#src/app/demos/pageDemoRouteIsMounted.ts"
import { pageRouteInventory } from "#src/app/demos/pageRouteInventory.ts"
import { urlOverview } from "#src/app/pages/urlOverview.ts"
import { urlTodo } from "#src/app/pages/urlTodo.ts"
import { pageRouteAuth } from "#src/auth/url/pageRouteAuth.ts"
import { noteRoutesCreate } from "#src/note/url/noteRoutesCreate.ts"
import { getRoutesOrgInvitation } from "#src/org/invitation_url/getRoutesOrgInvitation.ts"
import { getRoutesOrgMember } from "#src/org/member_url/getRoutesOrgMember.ts"
import { getRoutesOrg } from "#src/org/org_url/getRoutesOrg.ts"
import { projectRoutesCreate } from "#src/project/url/projectRoutesCreate.ts"
import { getRoutesResource } from "#src/resource/url/getRoutesResource.ts"
import { teamRoutesCreate } from "#src/team/url/teamRoutesCreate.ts"
import { userManagementRoutesCreate } from "#src/user_management/url/userManagementRoutesCreate.ts"

const mountedNonDemoRoutes = [
  ...Object.values(pageRouteAuth).map((path) => ({ path })),
  ...["/", urlOverview(), urlTodo()].map((path) => ({ path })),
  ...getRoutesOrg(),
  ...getRoutesOrgMember(),
  ...getRoutesOrgInvitation(),
  ...getRoutesResource(),
  ...teamRoutesCreate(),
  ...projectRoutesCreate(),
  ...noteRoutesCreate(),
  ...userManagementRoutesCreate(),
]

describe("page demo route inventory", () => {
  test("covers every mounted non-demo route registry entry exactly once", () => {
    const mountedPaths = mountedNonDemoRoutes.map(({ path }) => path).sort()
    const inventoryPaths: string[] = pageRouteInventory.map(({ route }) => route).sort()

    expect(mountedPaths).toHaveLength(91)
    expect(inventoryPaths).toHaveLength(91)
    expect(inventoryPaths).toEqual(mountedPaths)
  })

  test("assigns each route a distinct generator-compatible page demo entry and matching example params", () => {
    const demoEntries = pageRouteInventory.map(({ demoEntry }) => demoEntry)
    expect(new Set(demoEntries).size).toBe(91)

    for (const { route, title, pageImport, params, demoEntry } of pageRouteInventory) {
      expect(title.length).toBeGreaterThan(0)
      expect(pageImport).toMatch(/^#src\/.+\.tsx$/)
      expect(demoEntry).toMatch(/^pages\/Demo[A-Za-z0-9]+$/)

      const routeParams = [...route.matchAll(/:([^/]+)/g)].map(([, key]) => key!).sort()
      expect(Object.keys(params).sort()).toEqual(routeParams)
    }
  })

  test("guards unmounted new routes and keeps isolated renderers mounted", () => {
    const guardedRoutes = pageRouteInventory.filter(({ route }) => !pageDemoRouteIsMounted(route))
    const mountedRoutes = pageRouteInventory.filter(({ route }) => pageDemoRouteIsMounted(route))

    expect(guardedRoutes).toHaveLength(55)
    expect(mountedRoutes).toHaveLength(36)
  })

  test("keeps app, organization, and resource inventory routes in their actual renderer maps", async () => {
    const mapSources = await Promise.all([
      Bun.file(new URL("./appPageDemoRendererMap.tsx", import.meta.url)).text(),
      Bun.file(new URL("../../org/org_ui/demo/orgDemoRendererMap.tsx", import.meta.url)).text(),
      Bun.file(new URL("../../resource/ui/demo/ResourcePageDemoRenderer.tsx", import.meta.url)).text(),
    ])
    const [app, org, resource] = mapSources

    for (const { route } of pageRouteInventory) {
      const source =
        (route.startsWith("/org/") || route === "/org") &&
        !route.includes("/team") &&
        !route.includes("/project") &&
        !route.includes("/note")
          ? org
          : route.startsWith("/resources")
            ? resource
            : route === "/" || route === "/overview" || route === "/todo"
              ? app
              : undefined

      if (source !== undefined) expect(source).toContain(`"${route}"`)
    }
  })
})
