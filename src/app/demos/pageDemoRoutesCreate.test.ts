import { describe, expect, test } from "bun:test"
import { pageDemoHref } from "#src/app/demos/pageDemoHref.ts"
import { pageDemoRoutePathsCreate } from "#src/app/demos/pageDemoRoutePathsCreate.ts"
import { pageRouteInventory } from "#src/app/demos/pageRouteInventory.ts"

describe("page demo routing", () => {
  test("registers a catalog and exactly one dedicated route per inventory entry", () => {
    const paths = pageDemoRoutePathsCreate()
    expect(paths).toHaveLength(89)
    expect(new Set(paths).size).toBe(89)
    expect(paths).toEqual(pageRouteInventory.map(({ route }) => `/demos${route === "/" ? "/root" : route}`))
    expect(paths).toContain("/demos/root")
    expect(paths).not.toContain("/demos/pages")
  })

  test("builds clickable sample URLs from explicit params without linking to live pages", () => {
    const mountedPaths = pageDemoRoutePathsCreate()
    for (const [index, { route }] of pageRouteInventory.entries()) {
      const href = pageDemoHref(route)
      expect(href).toStartWith("/demos/")
      expect(href).not.toContain(":")
      expect(href).not.toContain("undefined")
      const mountedPattern = mountedPaths[index]!.replace(/:([^/]+)/g, "[^/]+")
      expect(href).toMatch(new RegExp(`^${mountedPattern}$`))
    }
    expect(pageDemoHref("/")).toBe("/demos/root")
    expect(pageDemoHref("/overview")).toBe("/demos/overview")
    expect(pageDemoHref("/org/:orgHandle/members/:memberId/edit")).toBe("/demos/org/sample-org/members/member-1/edit")
    expect(pageDemoHref("/org/:orgHandle/members/:memberId/edit", { orgHandle: "other org", memberId: "m/1" })).toBe(
      "/demos/org/other%20org/members/m%2F1/edit",
    )
  })

  test("registers page details before component routes under the shared catalog", async () => {
    const [demoRoutes, pageRoutes] = await Promise.all([
      Bun.file(new URL("./demoRoutesCreate.tsx", import.meta.url)).text(),
      Bun.file(new URL("./pageDemoRoutesCreate.tsx", import.meta.url)).text(),
    ])

    expect(pageRoutes).toContain("const detailPaths = pageDemoRoutePathsCreate()")
    expect(pageRoutes).toContain("path: detailPaths[index]!")
    expect(demoRoutes).toContain("...pageRoutes,")
    expect(demoRoutes).toContain('{ path: "/demos", component: DemoCatalog }')
    expect(demoRoutes).toContain('path: "/demos/pages"')
    expect(demoRoutes).toContain('({ path }) => path !== "/demos" && path !== "/demos/*" && !pagePaths.has(path)')
    expect(demoRoutes.match(/component: DemoCatalog/g)).toHaveLength(1)
  })

  test("keeps all production page imports as inert metadata, never route components", () => {
    const routeSource = Bun.file(new URL("./pageDemoRoutesCreate.tsx", import.meta.url))
    const boundarySource = Bun.file(new URL("./PageDemoBoundary.tsx", import.meta.url))
    return Promise.all([routeSource.text(), boundarySource.text()]).then(([routes, boundary]) => {
      expect(routes).not.toContain("pageImport")
      expect(routes).not.toContain("import(")
      expect(boundary).not.toContain("pageImport")
      expect(boundary).not.toContain("p.children")
      expect(boundary).toContain("<ConvexContext.Provider value={undefined}>")
    })
  })

  test("opts in only explicitly mounted renderers; all remaining routes stay guarded", async () => {
    const [boundary, view, page, demoState] = await Promise.all([
      Bun.file(new URL("./PageDemoBoundary.tsx", import.meta.url)).text(),
      Bun.file(new URL("../../auth/ui/profile_me/UserProfileMeApiKeysView.tsx", import.meta.url)).text(),
      Bun.file(new URL("../../auth/ui/profile_me/UserProfileMeApiKeysPage.tsx", import.meta.url)).text(),
      Bun.file(new URL("../../auth/ui/profile_me/userProfileMeApiKeysDemoStateCreate.ts", import.meta.url)).text(),
    ])
    expect(pageRouteInventory.filter((entry) => entry.route !== "/profile/api-keys")).toHaveLength(88)
    expect(boundary).toContain('route === "/profile/api-keys"')
    expect(boundary).toContain("pageDemoRouteIsMounted(entry().route)")
    expect(boundary).toContain("Page view not mounted yet")
    expect(boundary).toContain('profileHref={pageDemoHref("/profile")}')
    expect(boundary).toContain('apiKeysHref={pageDemoHref("/profile/api-keys")}')
    expect(boundary).toContain("stateFactory={userProfileMeApiKeysDemoStateCreate}")
    expect(page).toContain("stateFactory={userProfileMeApiKeysPageStateCreate}")
    expect(view).toContain("<UserProfileMeApiKeysContent stateFactory={p.stateFactory} />")
    expect(demoState).not.toMatch(/mutationCreate|queryCreate|api\.auth|userTokenGet|fetch\(/)
  })

  test("activates only the three prepared sign-in demos", async () => {
    const boundary = await Bun.file(new URL("./PageDemoBoundary.tsx", import.meta.url)).text()
    expect(boundary).toContain('const authDemoRoutes = ["/sign-in", "/sign-in-enter-otp", "/sign-in-error"]')
    expect(boundary).toContain("<AuthPageDemoRenderer route={entry().route} />")
  })

  test("activates the remaining auth demos including the final profile subset", async () => {
    const boundary = await Bun.file(new URL("./PageDemoBoundary.tsx", import.meta.url)).text()
    const routes = boundary.match(/const authRemainingDemoRoutes = \[([\s\S]*?)\]/)?.[1]
    expect(routes).toBeDefined()
    expect(boundary).toContain("authRemainingDemoRoutes.includes(entry().route)")
    expect(boundary).toContain("<AuthRemainingPageDemoRenderer route={entry().route} />")
    for (const route of [
      "/sign-up",
      "/sign-up-confirm-email",
      "/sso",
      "/profile",
      "/profile/edit",
      "/profile/change-password",
      "/profile/change-email",
      "/profile/update-image",
      "/profile/delete",
      "/u/:username",
    ]) {
      expect(routes).toContain(`"${route}"`)
    }
    expect(routes).not.toContain('"/profile/api-keys"')
  })

  test("activates only organization list, create, and view demos", async () => {
    const [boundary, renderer] = await Promise.all([
      Bun.file(new URL("./PageDemoBoundary.tsx", import.meta.url)).text(),
      Bun.file(new URL("../../org/org_ui/demo/orgDemoRendererMap.tsx", import.meta.url)).text(),
    ])
    expect(boundary).toContain("orgDemoRoutes.includes(entry().route)")
    expect(boundary).toContain("component={orgDemoRendererMap[entry().route as keyof typeof orgDemoRendererMap]}")
    expect(renderer).toContain('"/org": OrgDemoList')
    expect(renderer).toContain('"/org/create": OrgDemoCreate')
    expect(renderer).toContain('"/org/:orgHandle": OrgDemoView')
  })

  test("activates all prepared resource demos", async () => {
    const [boundary, renderer] = await Promise.all([
      Bun.file(new URL("./PageDemoBoundary.tsx", import.meta.url)).text(),
      Bun.file(new URL("../../resource/ui/demo/ResourcePageDemoRenderer.tsx", import.meta.url)).text(),
    ])
    expect(boundary).toContain('"/resources/:resourceId/edit"')
    expect(boundary).toContain('"/resources/:resourceId/remove"')
    expect(boundary).toContain("<ResourcePageDemoRenderer route={entry().route} />")
    expect(renderer).toContain('"/resources": () => <ResourceListDemo />')
    expect(renderer).toContain('"/resources/add": () => <ResourceAddDemo />')
    expect(renderer).toContain('"/resources/:resourceId": () => <ResourceViewDemo')
    expect(renderer).toContain('"/resources/:resourceId/edit": () => <ResourceEditDemo')
    expect(renderer).toContain('"/resources/:resourceId/remove": () => <ResourceRemoveDemo')
  })

  test("activates the prepared app page renderer map", async () => {
    const boundary = await Bun.file(new URL("./PageDemoBoundary.tsx", import.meta.url)).text()
    expect(boundary).toContain("entry().route in appPageDemoRendererMap")
    expect(boundary).toContain("component={appPageDemoRendererMap[")
  })
})
