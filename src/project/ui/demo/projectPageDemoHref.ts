import { pageDemoHref } from "#src/app/demos/pageDemoHref.ts"

export interface ProjectPageDemoContext {
  orgHandle?: string
  teamId?: string
  projectId?: string
}

/** Demo-internal links for project routes: scope variants stay inside /demos. */
export function projectPageDemoHref(
  view: "list" | "create" | "detail" | "edit",
  context: ProjectPageDemoContext = {},
): string {
  const { orgHandle, teamId, projectId } = context
  if (view === "list") {
    if (orgHandle && teamId) return pageDemoHref("/org/:orgHandle/team/:teamId/project", { orgHandle, teamId })
    if (teamId) return pageDemoHref("/team/:teamId/project", { teamId })
    if (orgHandle) return pageDemoHref("/org/:orgHandle/project", { orgHandle })
    return pageDemoHref("/project")
  }
  if (view === "create") {
    if (orgHandle && teamId) return pageDemoHref("/org/:orgHandle/team/:teamId/project/create", { orgHandle, teamId })
    return pageDemoHref("/team/:teamId/project/create", { teamId })
  }
  if (view === "detail") {
    if (orgHandle && teamId)
      return pageDemoHref("/org/:orgHandle/team/:teamId/project/:projectId", { orgHandle, teamId, projectId })
    if (teamId) return pageDemoHref("/team/:teamId/project/:projectId", { teamId, projectId })
    if (orgHandle) return pageDemoHref("/org/:orgHandle/project/:projectId", { orgHandle, projectId })
    return pageDemoHref("/project/:projectId", { projectId })
  }
  if (orgHandle && teamId)
    return pageDemoHref("/org/:orgHandle/team/:teamId/project/:projectId/edit", {
      orgHandle,
      teamId,
      projectId,
    })
  if (teamId) return pageDemoHref("/team/:teamId/project/:projectId/edit", { teamId, projectId })
  if (orgHandle) return pageDemoHref("/org/:orgHandle/project/:projectId/edit", { orgHandle, projectId })
  return pageDemoHref("/project/:projectId/edit", { projectId })
}
