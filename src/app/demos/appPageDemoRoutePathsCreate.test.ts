import { describe, expect, test } from "bun:test"
import { appPageDemoActiveHrefCreate } from "#src/app/demos/appPageDemoActiveHrefCreate.ts"
import { appPageDemoRoutePathsCreate } from "#src/app/demos/appPageDemoRoutePathsCreate.ts"
import { pageDemoRouteIsMounted } from "#src/app/demos/pageDemoRouteIsMounted.ts"
import { pageDemoRoutePathsCreate } from "#src/app/demos/pageDemoRoutePathsCreate.ts"
import { pageRouteInventory } from "#src/app/demos/pageRouteInventory.ts"

describe("shell-wrapped app page demos", () => {
  test("registers exactly one /demos/app twin path per mounted gallery entry", () => {
    const paths = appPageDemoRoutePathsCreate()
    const mounted = pageRouteInventory.filter((entry) => pageDemoRouteIsMounted(entry.route))
    expect(mounted.length).toBeGreaterThan(0)
    expect(paths).toHaveLength(mounted.length)
    expect(new Set(paths).size).toBe(paths.length)
    expect(paths).toEqual(mounted.map(({ route }) => `/demos/app${route === "/" ? "/root" : route}`))
  })

  test("twin paths mirror the gallery scheme without colliding with gallery or shell routes", () => {
    const twinPaths = appPageDemoRoutePathsCreate()
    const galleryPaths = pageDemoRoutePathsCreate()
    for (const path of twinPaths) {
      expect(path).toStartWith("/demos/app/")
      expect(galleryPaths).not.toContain(path)
    }
    expect(twinPaths).not.toContain("/demos/shell")
    expect(twinPaths).not.toContain("/demos")
    expect(twinPaths).toContain("/demos/app/root")
    expect(twinPaths).toContain("/demos/app/org")
    expect(twinPaths).toContain("/demos/app/org/:orgHandle/members")
    expect(twinPaths).toContain("/demos/app/resources/:resourceId/edit")
  })

  test("route factory stays generated from the inventory twin paths", async () => {
    const source = await Bun.file(new URL("./appPageDemoRoutesCreate.tsx", import.meta.url)).text()
    expect(source).toContain("appPageDemoRoutePathsCreate")
    expect(source).toContain("AppPageDemo")
  })

  test("resolves the sidebar highlight the real shell would use", () => {
    expect(appPageDemoActiveHrefCreate("/")).toBe("/overview")
    expect(appPageDemoActiveHrefCreate("/overview")).toBe("/overview")
    expect(appPageDemoActiveHrefCreate("/org")).toBe("/org")
    expect(appPageDemoActiveHrefCreate("/org/:orgHandle/members")).toBe("/org")
    expect(appPageDemoActiveHrefCreate("/org/:orgHandle/invitations/:invitationCode/accept")).toBe("/org")
    // Resources and profile pages live in the shell but have no nav entry,
    // so the real shell falls back to the first item just like here.
    expect(appPageDemoActiveHrefCreate("/resources")).toBe("/overview")
    expect(appPageDemoActiveHrefCreate("/profile")).toBe("/overview")
  })
})
