import { flush } from "solid-js"
import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { createRoot } from "solid-js"
import { pageDemoFixtureStoreGet } from "#src/app/demos/pageDemoFixtureStoreGet.ts"
import { userManagementPageDemoFixturesGet } from "#src/user_management/ui/demo/userManagementPageDemoFixturesGet.ts"

beforeAll(() => {
  pageDemoFixtureStoreGet().clear()
})
afterAll(() => {
  pageDemoFixtureStoreGet().clear()
})

describe("user-management page demo fixtures", () => {
  test("seeds the sample world users and supports local role assignment", () => {
    const { fixtures, dispose } = createRoot((disposeRoot) => ({
      fixtures: userManagementPageDemoFixturesGet(),
      dispose: disposeRoot,
    }))
    try {
      const admin = fixtures.get("user-1")
      expect(admin?.displayName).toBe("Test User")
      expect(admin?.roles).toContain("admin")
      expect(fixtures.users().length).toBeGreaterThanOrEqual(3)

      const updated = fixtures.assign("user-2", { roles: ["member", "admin"], teamIds: ["team-1"] })
      expect(updated?.roles).toEqual(["member", "admin"])
      flush()
      expect(fixtures.get("user-2")?.teamIds).toEqual(["team-1"])
      fixtures.assign("user-2", { roles: ["member"], teamIds: ["team-2"] })
      flush()
      expect(fixtures.get("user-2")?.roles).toEqual(["member"])
    } finally {
      dispose()
    }
  })
})
