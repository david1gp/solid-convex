import { expect, test } from "bun:test"
import { pageDemoHref } from "#src/app/demos/pageDemoHref.ts"
import { pageDemoRouteIsMounted } from "#src/app/demos/pageDemoRouteIsMounted.ts"

test("each final auth demo is mounted with isolated state and demo-only links", () => {
  for (const route of [
    "/profile/change-password",
    "/profile/change-email",
    "/profile/update-image",
    "/profile/delete",
  ] as const) {
    expect(pageDemoRouteIsMounted(route)).toBe(true)
    expect(pageDemoHref(route)).toStartWith("/demos/profile/")
  }
  expect(pageDemoRouteIsMounted("/u/:username")).toBe(true)
  expect(pageDemoHref("/u/:username")).toBe("/demos/u/sample-user")
  expect(pageDemoRouteIsMounted("/profile/api-keys")).toBe(true)
})
