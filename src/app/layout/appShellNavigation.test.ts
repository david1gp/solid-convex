import { describe, expect, it } from "bun:test"
import { appShellNavigation } from "./appShellNavigation.ts"

describe("appShellNavigation", () => {
  it("provides the exact required sidebar navigation entries in order", () => {
    const items = appShellNavigation()
    expect(items.map((i) => i.label)).toEqual([
      "Overview",
      "Organizations",
      "Teams",
      "Projects",
      "Notes",
    ])
    expect(items.map((i) => i.href)).toEqual(["/overview", "/org", "/team", "/project", "/note"])
  })

  it("removes Resources from the sidebar items", () => {
    const items = appShellNavigation()
    expect(items.find((i) => i.label === "Resources")).toBeUndefined()
    expect(items.find((i) => i.href.includes("resource"))).toBeUndefined()
  })
})
