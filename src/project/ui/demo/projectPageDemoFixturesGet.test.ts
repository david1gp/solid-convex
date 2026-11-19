import { flush } from "solid-js"
import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { createRoot } from "solid-js"
import { pageDemoFixtureStoreGet } from "#src/app/demos/pageDemoFixtureStoreGet.ts"
import { projectPageDemoFixturesGet } from "#src/project/ui/demo/projectPageDemoFixturesGet.ts"

beforeAll(() => {
  pageDemoFixtureStoreGet().clear()
})
afterAll(() => {
  pageDemoFixtureStoreGet().clear()
})

describe("project page demo fixtures", () => {
  test("seeds the sample world projects and supports local add/edit/remove", () => {
    const { fixtures, dispose } = createRoot((disposeRoot) => ({
      fixtures: projectPageDemoFixturesGet(),
      dispose: disposeRoot,
    }))
    try {
      expect(fixtures.get("project-1")?.name).toBe("Website Redesign")
      expect(fixtures.get("project-2")?.teamId as string).toBe("team-1")
      expect(fixtures.get("project-3")?.teamId as string).toBe("team-2")
      expect(fixtures.projects()).toHaveLength(3)

      const added = fixtures.add({ name: "Docs Site", teamId: "team-1" })
      flush()
      expect(fixtures.get(added.projectId)?.name).toBe("Docs Site")
      flush()
      fixtures.edit(added.projectId, { name: "Docs Portal" })
      flush()
      expect(fixtures.get(added.projectId)?.name).toBe("Docs Portal")
      flush()
      fixtures.remove(added.projectId)
      flush()
      expect(fixtures.get(added.projectId)).toBeUndefined()
      expect(fixtures.projects()).toHaveLength(3)
    } finally {
      dispose()
    }
  })
})
