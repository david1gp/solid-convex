import { describe, expect, test } from "bun:test"
import { projectHrefGet } from "#src/project/ui/projectHrefGet.ts"

describe("project UI navigation", () => {
  test("global navigation routes by stable project ID without parent context", () => {
    expect(projectHrefGet("list")).toBe("/project")
    expect(projectHrefGet("detail", { projectId: "proj-1" })).toBe("/project/proj-1")
    expect(projectHrefGet("edit", { projectId: "proj-1" })).toBe("/project/proj-1/edit")
  })

  test("team contextual navigation includes team ID", () => {
    expect(projectHrefGet("list", { teamId: "team-1" })).toBe("/team/team-1/project")
    expect(projectHrefGet("create", { teamId: "team-1" })).toBe("/team/team-1/project/create")
    expect(projectHrefGet("detail", { teamId: "team-1", projectId: "proj-1" })).toBe("/team/team-1/project/proj-1")
    expect(projectHrefGet("edit", { teamId: "team-1", projectId: "proj-1" })).toBe("/team/team-1/project/proj-1/edit")
  })

  test("org and team contextual navigation retains both organization handle and team ID", () => {
    expect(projectHrefGet("list", { orgHandle: "acme", teamId: "team-1" })).toBe("/org/acme/team/team-1/project")
    expect(projectHrefGet("create", { orgHandle: "acme", teamId: "team-1" })).toBe(
      "/org/acme/team/team-1/project/create",
    )
    expect(projectHrefGet("detail", { orgHandle: "acme", teamId: "team-1", projectId: "proj-1" })).toBe(
      "/org/acme/team/team-1/project/proj-1",
    )
    expect(projectHrefGet("edit", { orgHandle: "acme", teamId: "team-1", projectId: "proj-1" })).toBe(
      "/org/acme/team/team-1/project/proj-1/edit",
    )
  })

  test("org-only contextual navigation retains organization handle", () => {
    expect(projectHrefGet("list", { orgHandle: "acme" })).toBe("/org/acme/project")
    expect(projectHrefGet("detail", { orgHandle: "acme", projectId: "proj-1" })).toBe("/org/acme/project/proj-1")
    expect(projectHrefGet("edit", { orgHandle: "acme", projectId: "proj-1" })).toBe("/org/acme/project/proj-1/edit")
  })

  test("creation without team parent falls back to default list", () => {
    expect(projectHrefGet("create")).toBe("/project")
  })
})
