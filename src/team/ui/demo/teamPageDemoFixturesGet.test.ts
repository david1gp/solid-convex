import { flush } from "solid-js"
import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { createRoot } from "solid-js"
import { pageDemoFixtureStoreGet } from "#src/app/demos/pageDemoFixtureStoreGet.ts"
import { teamPageDemoFixturesGet } from "#src/team/ui/demo/teamPageDemoFixturesGet.ts"

beforeAll(() => {
  pageDemoFixtureStoreGet().clear()
})
afterAll(() => {
  pageDemoFixtureStoreGet().clear()
})

describe("team page demo fixtures", () => {
  test("seeds the sample world teams and supports local add/edit/remove", () => {
    const { fixtures, dispose } = createRoot((disposeRoot) => ({
      fixtures: teamPageDemoFixturesGet(),
      dispose: disposeRoot,
    }))
    try {
      expect(fixtures.get("team-1")?.name).toBe("Core Team")
      expect(fixtures.get("team-2")?.name).toBe("Design")
      expect(fixtures.teams()).toHaveLength(2)

      const added = fixtures.add({ name: "Docs", description: "Documentation guild." })
      flush()
      expect(fixtures.get(added.teamId)?.name).toBe("Docs")
      flush()
      fixtures.edit(added.teamId, { name: "Docs Guild" })
      flush()
      expect(fixtures.get(added.teamId)?.name).toBe("Docs Guild")
      flush()
      fixtures.remove(added.teamId)
      flush()
      expect(fixtures.get(added.teamId)).toBeUndefined()
      expect(fixtures.teams()).toHaveLength(2)
    } finally {
      dispose()
    }
  })
})
