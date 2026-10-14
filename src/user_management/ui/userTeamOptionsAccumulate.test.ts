import { describe, expect, test } from "bun:test"
import { userTeamOptionsAccumulate } from "#src/user_management/ui/userTeamOptionsAccumulate.ts"

describe("userTeamOptionsAccumulate", () => {
  test("accumulates incoming team page and resolves org labels", () => {
    const orgMap = new Map([["org-1", "Acme Org"]])
    const incoming = [{ teamId: "t-1", name: "Alpha", orgId: "org-1" }]

    const result = userTeamOptionsAccumulate({
      existingOptions: [],
      incomingPage: incoming,
      orgMap,
      selectedTeamIds: [],
    })

    expect(result).toEqual([
      {
        id: "t-1",
        name: "Alpha",
        subtitle: "Org: Acme Org",
      },
    ])
  })

  test("accumulates multiple pages without duplicating existing entries", () => {
    const orgMap = new Map([
      ["org-1", "Acme Org"],
      ["org-2", "Beta Org"],
    ])
    const initial = [{ id: "t-1", name: "Alpha", subtitle: "Org: Acme Org" }]
    const incomingPage2 = [{ teamId: "t-2", name: "Beta", orgId: "org-2" }]

    const result = userTeamOptionsAccumulate({
      existingOptions: initial,
      incomingPage: incomingPage2,
      orgMap,
      selectedTeamIds: [],
    })

    expect(result).toHaveLength(2)
    expect(result.map((o) => o.id)).toEqual(["t-1", "t-2"])
  })

  test("preserves selected options even if not in fetched team pages", () => {
    const orgMap = new Map<string, string>()
    const initial = [{ id: "t-1", name: "Alpha" }]

    const result = userTeamOptionsAccumulate({
      existingOptions: initial,
      incomingPage: [],
      orgMap,
      selectedTeamIds: ["t-1", "t-unknown-assigned"],
    })

    expect(result).toEqual([
      { id: "t-1", name: "Alpha" },
      {
        id: "t-unknown-assigned",
        name: "Team (t-unknown-assigned)",
        subtitle: "Existing assignment",
      },
    ])
  })
})
