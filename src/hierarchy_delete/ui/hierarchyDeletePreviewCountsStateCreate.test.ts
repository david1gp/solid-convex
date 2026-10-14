import { describe, expect, test } from "bun:test"
import { hierarchyDeletePreviewCountsStateCreate } from "#src/hierarchy_delete/ui/hierarchyDeletePreviewCountsStateCreate.ts"

describe("hierarchyDeletePreviewCountsStateCreate", () => {
  test("correctly maps and sums counts across all entities", () => {
    const counts = {
      orgs: 1,
      teams: 2,
      projects: 3,
      notes: 4,
      resources: 5,
      files: 6,
      orgMembers: 7,
      orgInvitations: 8,
      total: 36,
    }

    const state = hierarchyDeletePreviewCountsStateCreate({
      counts: () => counts,
      isTruncated: () => false,
    })

    expect(state.total()).toBe(36)
    expect(state.hasItems()).toBe(true)
    expect(state.isTruncated()).toBe(false)

    const items = state.items()
    expect(items).toHaveLength(8)
    expect(items.find((i) => i.key === "orgs")?.count).toBe(1)
    expect(items.find((i) => i.key === "teams")?.count).toBe(2)
    expect(items.find((i) => i.key === "projects")?.count).toBe(3)
    expect(items.find((i) => i.key === "notes")?.count).toBe(4)
    expect(items.find((i) => i.key === "resources")?.count).toBe(5)
    expect(items.find((i) => i.key === "files")?.count).toBe(6)
    expect(items.find((i) => i.key === "orgMembers")?.count).toBe(7)
    expect(items.find((i) => i.key === "orgMembers")?.label).toBe("Organization memberships")
    expect(items.find((i) => i.key === "orgInvitations")?.count).toBe(8)
    expect(items.find((i) => i.key === "orgInvitations")?.label).toBe("Invitations")
  })

  test("handles undefined counts and truncation flag gracefully", () => {
    const state = hierarchyDeletePreviewCountsStateCreate({
      counts: () => undefined,
      isTruncated: () => true,
    })

    expect(state.total()).toBe(0)
    expect(state.hasItems()).toBe(false)
    expect(state.isTruncated()).toBe(true)
    expect(state.items()).toHaveLength(0)
  })
})
