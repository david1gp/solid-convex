import { describe, expect, test } from "bun:test"
import { pageDemoHref } from "#src/app/demos/pageDemoHref.ts"
import { pageDemoRouteIsMounted } from "#src/app/demos/pageDemoRouteIsMounted.ts"
import { pageDemoRoutePathsCreate } from "#src/app/demos/pageDemoRoutePathsCreate.ts"
import { pageRouteInventory } from "#src/app/demos/pageRouteInventory.ts"

describe("page demo routing", () => {
  test("registers a catalog and exactly one dedicated route per inventory entry", () => {
    const paths = pageDemoRoutePathsCreate()
    expect(paths).toHaveLength(91)
    expect(new Set(paths).size).toBe(91)
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

  test("opts in only explicitly mounted renderers; all remaining routes stay guarded", () => {
    expect(pageRouteInventory.filter((entry) => entry.route !== "/profile/api-keys")).toHaveLength(90)
    expect(pageDemoRouteIsMounted("/profile/api-keys")).toBe(true)
    for (const route of ["/", "/overview", "/todo"] as const) {
      expect(pageDemoHref(route)).toStartWith("/demos/")
    }
  })

  test("activates only the three prepared sign-in demos", () => {
    for (const route of ["/sign-in", "/sign-in-enter-otp", "/sign-in-error"] as const) {
      expect(pageDemoRouteIsMounted(route)).toBe(true)
    }
  })

  test("activates the remaining auth demos including the final profile subset", () => {
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
    ] as const) {
      expect(pageDemoRouteIsMounted(route)).toBe(true)
    }
    expect(pageDemoRouteIsMounted("/profile/api-keys")).toBe(true)
  })

  test("activates only organization list, create, and view demos", () => {
    for (const route of ["/org", "/org/create", "/org/:orgHandle"]) {
      expect(pageDemoRouteIsMounted(route)).toBe(true)
    }
  })

  test("activates all prepared resource demos", () => {
    for (const route of [
      "/resources",
      "/resources/add",
      "/resources/:resourceId",
      "/resources/:resourceId/edit",
      "/resources/:resourceId/remove",
    ]) {
      expect(pageDemoRouteIsMounted(route)).toBe(true)
    }
  })

  test("activates the prepared app page renderer map", () => {
    for (const route of ["/", "/overview", "/todo"]) {
      expect(pageDemoRouteIsMounted(route)).toBe(true)
    }
  })
})
