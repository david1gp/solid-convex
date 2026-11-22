import { describe, expect, test } from "bun:test"
import { routePageTitle } from "#src/app/router/routePageTitle.ts"

describe("route page titles", () => {
  test("provides a title for the overview and demo routes", () => {
    expect(routePageTitle("/")).toBe("Overview · Solid Convex")
    expect(routePageTitle("/demos")).toBe("Demos · Solid Convex")
    expect(routePageTitle("/demos/ui/DemoButtons")).toBe("Demo Buttons · Solid Convex")
  })

  test("uses route names rather than parameter placeholders", () => {
    expect(routePageTitle("/org/:orgHandle/note")).toBe("Note · Solid Convex")
    expect(routePageTitle("/org/:orgHandle/note/:noteId/edit")).toBe("Edit · Solid Convex")
  })
})
