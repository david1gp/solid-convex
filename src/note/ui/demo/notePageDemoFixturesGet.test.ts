import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { createRoot } from "solid-js"
import { pageDemoFixtureStoreGet } from "#src/app/demos/pageDemoFixtureStoreGet.ts"
import { notePageDemoFixturesGet } from "#src/note/ui/demo/notePageDemoFixturesGet.ts"

beforeAll(() => {
  pageDemoFixtureStoreGet().clear()
})
afterAll(() => {
  pageDemoFixtureStoreGet().clear()
})

describe("note page demo fixtures", () => {
  test("seeds markdown notes and supports local add/edit/remove", () => {
    const { fixtures, dispose } = createRoot((disposeRoot) => ({
      fixtures: notePageDemoFixturesGet(),
      dispose: disposeRoot,
    }))
    try {
      const first = fixtures.get("note-1")
      expect(first?.title).toBe("Launch checklist")
      expect(first?.content).toContain("# Launch checklist")
      expect(first?.content).toContain("## Goals")
      expect(first?.content).toContain("- [x] Draft announcement post")
      expect(first?.content).toContain("- [ ] Publish changelog")
      expect(first?.content).toContain("1. Deploy to staging")
      expect(fixtures.notes().length).toBeGreaterThanOrEqual(3)

      const added = fixtures.add({
        content: "# Added note\n\n- [ ] Follow up",
        title: "Added note",
        projectId: "project-1",
        teamId: "team-1",
      })
      expect(fixtures.get(added.noteId)?.title).toBe("Added note")
      fixtures.edit(added.noteId, { content: "# Renamed\n\nbody", title: "Renamed" })
      expect(fixtures.get(added.noteId)?.title).toBe("Renamed")
      fixtures.remove(added.noteId)
      expect(fixtures.get(added.noteId)).toBeUndefined()
    } finally {
      dispose()
    }
  })
})
