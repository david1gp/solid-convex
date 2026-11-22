import { expect, test } from "bun:test"
import { pageTitleFormat } from "#src/app/router/pageTitleFormat.ts"

test("page-specific titles receive the standard suffix exactly once", () => {
  expect(pageTitleFormat("Organizations")).toBe("Organizations · Solid Convex")
  expect(pageTitleFormat("Not found · Solid Convex")).toBe("Not found · Solid Convex")
})
