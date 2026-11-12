import { describe, expect, test } from "bun:test"
import { pageDemoRouteIsMounted } from "#src/app/demos/pageDemoRouteIsMounted.ts"
import { pageRouteInventory } from "#src/app/demos/pageRouteInventory.ts"
import { notePageDemoHref } from "#src/note/ui/demo/notePageDemoHref.ts"
import { projectPageDemoHref } from "#src/project/ui/demo/projectPageDemoHref.ts"
import { teamPageDemoHref } from "#src/team/ui/demo/teamPageDemoHref.ts"

const expectedTeamRoutes = [
  "/team",
  "/team/:teamId",
  "/team/:teamId/edit",
  "/org/:orgHandle/team",
  "/org/:orgHandle/team/create",
  "/org/:orgHandle/team/:teamId",
  "/org/:orgHandle/team/:teamId/edit",
]

const expectedProjectRoutes = [
  "/project",
  "/org/:orgHandle/project",
  "/team/:teamId/project",
  "/org/:orgHandle/team/:teamId/project",
  "/team/:teamId/project/create",
  "/org/:orgHandle/team/:teamId/project/create",
  "/project/:projectId/edit",
  "/org/:orgHandle/project/:projectId/edit",
  "/team/:teamId/project/:projectId/edit",
  "/org/:orgHandle/team/:teamId/project/:projectId/edit",
  "/project/:projectId",
  "/org/:orgHandle/project/:projectId",
  "/team/:teamId/project/:projectId",
  "/org/:orgHandle/team/:teamId/project/:projectId",
]

const expectedUserRoutes = ["/user-management", "/user-management/:userId"]

async function rendererSource(name: string) {
  return Bun.file(new URL(`../../${name}`, import.meta.url)).text()
}

describe("team/project/note/user-management demo coverage", () => {
  test("renderer sources register exactly the 55 team/project/note/user-management routes", async () => {
    const noteRoutes = pageRouteInventory.map(({ route }) => route).filter((route) => /(^|\/)note(\/|$)/.test(route))
    expect(noteRoutes).toHaveLength(32)

    const [teamSource, projectSource, noteSource, userSource, contentSource] = await Promise.all([
      rendererSource("team/ui/demo/TeamPageDemoRenderer.tsx"),
      rendererSource("project/ui/demo/ProjectPageDemoRenderer.tsx"),
      rendererSource("note/ui/demo/NotePageDemoRenderer.tsx"),
      rendererSource("user_management/ui/demo/UserManagementPageDemoRenderer.tsx"),
      rendererSource("app/demos/PageDemoContent.tsx"),
    ])
    for (const route of expectedTeamRoutes) {
      expect(teamSource).toContain(`"${route}"`)
      expect(pageDemoRouteIsMounted(route)).toBe(true)
    }
    for (const route of expectedProjectRoutes) {
      expect(projectSource).toContain(`"${route}"`)
      expect(pageDemoRouteIsMounted(route)).toBe(true)
    }
    for (const route of noteRoutes) {
      expect(noteSource).toContain(`"${route}"`)
      expect(pageDemoRouteIsMounted(route)).toBe(true)
    }
    for (const route of expectedUserRoutes) {
      expect(userSource).toContain(`"${route}"`)
      expect(pageDemoRouteIsMounted(route)).toBe(true)
    }
    for (const map of [
      "teamPageDemoRendererMap",
      "projectPageDemoRendererMap",
      "notePageDemoRendererMap",
      "userManagementPageDemoRendererMap",
    ]) {
      expect(contentSource).toContain(map)
    }
  })

  test("demo hrefs stay inside the gallery for every scope variant", () => {
    expect(teamPageDemoHref("list", {})).toBe("/demos/team")
    expect(teamPageDemoHref("list", { orgHandle: "sample-org" })).toBe("/demos/org/sample-org/team")
    expect(teamPageDemoHref("detail", { teamId: "team-1" })).toBe("/demos/team/team-1")
    expect(teamPageDemoHref("detail", { orgHandle: "sample-org", teamId: "team-1" })).toBe(
      "/demos/org/sample-org/team/team-1",
    )
    expect(teamPageDemoHref("edit", { orgHandle: "sample-org", teamId: "team-1" })).toBe(
      "/demos/org/sample-org/team/team-1/edit",
    )
    expect(teamPageDemoHref("create", { orgHandle: "sample-org" })).toBe("/demos/org/sample-org/team/create")

    expect(projectPageDemoHref("list", {})).toBe("/demos/project")
    expect(projectPageDemoHref("list", { orgHandle: "sample-org", teamId: "team-1" })).toBe(
      "/demos/org/sample-org/team/team-1/project",
    )
    expect(projectPageDemoHref("detail", { projectId: "project-1" })).toBe("/demos/project/project-1")
    expect(projectPageDemoHref("edit", { orgHandle: "sample-org", teamId: "team-1", projectId: "project-1" })).toBe(
      "/demos/org/sample-org/team/team-1/project/project-1/edit",
    )
    expect(projectPageDemoHref("create", { teamId: "team-1" })).toBe("/demos/team/team-1/project/create")

    expect(notePageDemoHref("list", {})).toBe("/demos/note")
    expect(notePageDemoHref("list", { projectId: "project-1" })).toBe("/demos/project/project-1/note")
    expect(
      notePageDemoHref("detail", {
        orgHandle: "sample-org",
        teamId: "team-1",
        projectId: "project-1",
        noteId: "note-1",
      }),
    ).toBe("/demos/org/sample-org/team/team-1/project/project-1/note/note-1")
    expect(notePageDemoHref("create", { orgHandle: "sample-org", teamId: "team-1", projectId: "project-1" })).toBe(
      "/demos/org/sample-org/team/team-1/project/project-1/note/create",
    )
    expect(notePageDemoHref("edit", { noteId: "note-1" })).toBe("/demos/note/note-1/edit")

    for (const href of [
      teamPageDemoHref("detail", { teamId: "team-1" }),
      projectPageDemoHref("detail", { projectId: "project-1" }),
      notePageDemoHref("detail", { noteId: "note-1" }),
    ]) {
      expect(href).toStartWith("/demos/")
      expect(href).not.toContain(":")
      expect(href).not.toContain("undefined")
    }
  })
})
