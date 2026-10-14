import { describe, expect, test } from "bun:test"

describe("overview page navigation", () => {
  test("uses the sidebar instead of the old top navbar", async () => {
    const source = await Bun.file(new URL("./OverviewPage.tsx", import.meta.url)).text()

    expect(source).not.toMatch(/NavStatic|NavCenter|UserNavButton/)
  })

  test("links to the hierarchy sections, user management, and resources", async () => {
    const source = await Bun.file(new URL("./OverviewPage.tsx", import.meta.url)).text()
    const state = await Bun.file(new URL("./overviewPageStateCreate.ts", import.meta.url)).text()

    expect(state).toContain("urlOrgList()")
    expect(state).toContain('"/team"')
    expect(state).toContain('"/project"')
    expect(state).toContain('"/note"')
    expect(state).toContain("urlResourceList()")
    expect(source).toContain("<AuthLinks")
  })
})
