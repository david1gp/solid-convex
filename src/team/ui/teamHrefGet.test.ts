import { describe, expect, test } from "bun:test"
import { teamHrefGet } from "#src/team/ui/teamHrefGet.ts"

describe("team UI navigation", () => {
  test("global rows navigate by stable team ID without inventing an organization handle", () => {
    expect(teamHrefGet("detail", undefined, "team-id")).toBe("/team/team-id")
    expect(teamHrefGet("edit", undefined, "team-id")).toBe("/team/team-id/edit")
  })
  test("contextual navigation retains the organization handle", () => {
    expect(teamHrefGet("list", "acme")).toBe("/org/acme/team")
    expect(teamHrefGet("create", "acme")).toBe("/org/acme/team/create")
    expect(teamHrefGet("detail", "acme", "team-id")).toBe("/org/acme/team/team-id")
    expect(teamHrefGet("edit", "acme", "team-id")).toBe("/org/acme/team/team-id/edit")
  })
  test("creation without a parent returns to organization selection", () => {
    expect(teamHrefGet("create")).toBe("/org")
  })
})
