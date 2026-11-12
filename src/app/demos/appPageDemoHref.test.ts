import { describe, expect, test } from "bun:test"
import { appPageDemoHref } from "#src/app/demos/appPageDemoHref.ts"
import { pageDemoHref } from "#src/app/demos/pageDemoHref.ts"
import { pageRouteInventory } from "#src/app/demos/pageRouteInventory.ts"

describe("app page demo href", () => {
  test("mirrors the gallery scheme under /demos/app with filled sample params", () => {
    for (const { route } of pageRouteInventory) {
      const href = appPageDemoHref(route)
      expect(href).toStartWith("/demos/app/")
      expect(href).not.toContain(":")
      expect(href).not.toContain("undefined")
      expect(href).toBe(pageDemoHref(route).replace("/demos/", "/demos/app/"))
    }
    expect(appPageDemoHref("/")).toBe("/demos/app/root")
    expect(appPageDemoHref("/overview")).toBe("/demos/app/overview")
    expect(appPageDemoHref("/org/:orgHandle/members/:memberId/edit")).toBe(
      "/demos/app/org/sample-org/members/member-1/edit",
    )
  })
})
