import { describe, expect, test } from "bun:test"
import { demoCatalogAreaCreate } from "#src/app/demos/demoCatalogAreaCreate.ts"
import { pageRouteInventory } from "#src/app/demos/pageRouteInventory.ts"

describe("demo catalog areas", () => {
  test("maps every inventory route into a known area with no leftovers", () => {
    const counts = new Map<string, number>()
    for (const { route } of pageRouteInventory) {
      const area = demoCatalogAreaCreate(route)
      counts.set(area, (counts.get(area) ?? 0) + 1)
    }
    expect([...counts.keys()].sort()).toEqual(
      [
        "Auth",
        "Notes",
        "Organizations",
        "Overview",
        "Profile",
        "Projects",
        "Resources",
        "Teams",
        "User management",
      ].sort(),
    )
    expect([...counts.values()].reduce((sum, count) => sum + count, 0)).toBe(pageRouteInventory.length)
  })

  test("groups nested scope variants under their leaf area", () => {
    expect(demoCatalogAreaCreate("/org")).toBe("Organizations")
    expect(demoCatalogAreaCreate("/org/:orgHandle/members")).toBe("Organizations")
    expect(demoCatalogAreaCreate("/org/:orgHandle/team")).toBe("Teams")
    expect(demoCatalogAreaCreate("/org/:orgHandle/team/:teamId/project")).toBe("Projects")
    expect(demoCatalogAreaCreate("/org/:orgHandle/team/:teamId/project/:projectId/note")).toBe("Notes")
    expect(demoCatalogAreaCreate("/resources")).toBe("Resources")
    expect(demoCatalogAreaCreate("/user-management")).toBe("User management")
    expect(demoCatalogAreaCreate("/profile/edit")).toBe("Profile")
    expect(demoCatalogAreaCreate("/u/:username")).toBe("Profile")
    expect(demoCatalogAreaCreate("/sign-in")).toBe("Auth")
    expect(demoCatalogAreaCreate("/")).toBe("Overview")
    expect(demoCatalogAreaCreate("/todo")).toBe("Overview")
  })
})
