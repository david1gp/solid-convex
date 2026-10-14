import { describe, expect, test } from "bun:test"

describe("overview page navigation", () => {
  test("uses the sidebar instead of the old top navbar", async () => {
    const source = await Bun.file(new URL("./OverviewPage.tsx", import.meta.url)).text()

    expect(source).not.toMatch(/NavStatic|NavCenter|UserNavButton/)
  })

  test("links to the main sections and the account page", async () => {
    const source = await Bun.file(new URL("./OverviewPage.tsx", import.meta.url)).text()

    expect(source).toContain("urlOrgList()")
    expect(source).toContain("urlResourceList()")
    expect(source).toContain("urlUserProfileMe()")
    expect(source).toContain("<AuthLinks")
  })
})
