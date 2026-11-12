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

  test("mounts every inventory route with an isolated renderer", () => {
    const guardedRoutes = pageRouteInventory.filter(({ route }) => !pageDemoRouteIsMounted(route))
    const mountedRoutes = pageRouteInventory.filter(({ route }) => pageDemoRouteIsMounted(route))

    expect(guardedRoutes).toHaveLength(0)
    expect(mountedRoutes).toHaveLength(91)
  })

  test("keeps app, organization, and resource inventory routes mounted in the demo boundary", () => {
    for (const { route } of pageRouteInventory) {
      if (
        (route.startsWith("/org/") || route === "/org") &&
        !route.includes("/team") &&
        !route.includes("/project") &&
        !route.includes("/note")
      ) {
        expect(pageDemoRouteIsMounted(route)).toBe(true)
      } else if (route.startsWith("/resources")) {
        expect(pageDemoRouteIsMounted(route)).toBe(true)
      } else if (route === "/" || route === "/overview" || route === "/todo") {
        expect(pageDemoRouteIsMounted(route)).toBe(true)
      }
    }
  })

  test("keeps team, project, note, and user-management inventory routes mounted in the demo boundary", () => {
    const teamProjectNoteUserRoutes = pageRouteInventory.filter(
      ({ route }) =>
        route.startsWith("/team") ||
        route.startsWith("/project") ||
        route.startsWith("/note") ||
        route.startsWith("/user-management") ||
        route.includes("/team") ||
        route.includes("/project") ||
        route.includes("/note"),
    )
    expect(teamProjectNoteUserRoutes).toHaveLength(55)
    for (const { route } of teamProjectNoteUserRoutes) {
      expect(pageDemoRouteIsMounted(route)).toBe(true)
    }
  })
})
