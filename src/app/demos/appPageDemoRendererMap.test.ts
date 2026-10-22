import { describe, expect, test } from "bun:test"
import { pageDemoHref } from "#src/app/demos/pageDemoHref.ts"
import { pageDemoRouteIsMounted } from "#src/app/demos/pageDemoRouteIsMounted.ts"

describe("app core page demos", () => {
  test("mounts overview aliases and todo as isolated demos", () => {
    for (const route of ["/", "/overview", "/todo"] as const) {
      expect(pageDemoRouteIsMounted(route)).toBe(true)
    }
  })

  test("demo cross-links resolve only to isolated gallery URLs", () => {
    for (const route of ["/", "/overview", "/todo"] as const) {
      expect(pageDemoHref(route)).toStartWith("/demos/")
      expect(pageDemoHref(route)).not.toBe(route)
    }
  })
})
