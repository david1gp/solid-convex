import { describe, expect, test } from "bun:test"
import { hierarchyDeleteWarningStateCreate } from "#src/hierarchy_delete/ui/hierarchyDeleteWarningStateCreate.ts"

describe("hierarchyDeleteWarningStateCreate", () => {
  test("generates appropriate scary warning texts for an organization", () => {
    const state = hierarchyDeleteWarningStateCreate({
      targetKind: () => "org",
      targetName: () => "Acme Corp",
      isTruncated: () => false,
    })

    expect(state.title()).toBe('Permanently delete org "Acme Corp"?')
    expect(state.description()).toContain("organization and ALL descendant teams, projects, notes")
    expect(state.accountWarning()).toBe("User accounts themselves are not deleted.")
    expect(state.truncationWarning()).toBe("")
  })

  test("generates appropriate scary warning texts for a team", () => {
    const state = hierarchyDeleteWarningStateCreate({
      targetKind: () => "team",
      targetName: () => "Alpha Team",
      isTruncated: () => false,
    })

    expect(state.title()).toBe('Permanently delete team "Alpha Team"?')
    expect(state.description()).toContain("team and ALL descendant projects, notes")
  })

  test("generates appropriate scary warning texts for a project", () => {
    const state = hierarchyDeleteWarningStateCreate({
      targetKind: () => "project",
      targetName: () => "Core App",
      isTruncated: () => false,
    })

    expect(state.title()).toBe('Permanently delete project "Core App"?')
    expect(state.description()).toContain("project and ALL descendant notes")
  })

  test("generates appropriate scary warning texts for a note", () => {
    const state = hierarchyDeleteWarningStateCreate({
      targetKind: () => "note",
      targetName: () => "Meeting Notes",
      isTruncated: () => false,
    })

    expect(state.title()).toBe('Permanently delete note "Meeting Notes"?')
    expect(state.description()).toContain("note and any directly attached resources")
  })

  test("includes truncation warning when isTruncated is true", () => {
    const state = hierarchyDeleteWarningStateCreate({
      targetKind: () => "org",
      targetName: () => "Large Org",
      isTruncated: () => true,
    })

    expect(state.isTruncated()).toBe(true)
    expect(state.truncationWarning()).toContain("exceeds the query limit and was truncated")
  })
})
