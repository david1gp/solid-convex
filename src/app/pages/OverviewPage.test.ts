import { describe, expect, test } from "bun:test"
import { overviewPageStateCreate } from "#src/app/pages/overviewPageStateCreate.ts"

describe("overview page navigation", () => {
  test("links to the hierarchy sections, user management, and resources", () => {
    const hrefs = overviewPageStateCreate()
      .cards()
      .map(({ href }) => href)

    expect(hrefs).toContain("/team")
    expect(hrefs).toContain("/project")
    expect(hrefs).toContain("/note")
    expect(hrefs.some((href) => href.includes("user-management"))).toBe(true)
    expect(hrefs.some((href) => href.includes("resource"))).toBe(true)
    expect(hrefs.some((href) => href.includes("org"))).toBe(true)
  })
})
