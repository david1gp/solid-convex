import { lazy } from "solid-js"
import type { RouteObject } from "#ui/utils/RouteConfig.ts"

const ProjectListPage = lazy(() =>
  import("#src/project/ui/ProjectListPage.tsx").then((module) => ({ default: module.ProjectListPage })),
)
const ProjectCreatePage = lazy(() =>
  import("#src/project/ui/ProjectCreatePage.tsx").then((module) => ({ default: module.ProjectCreatePage })),
)
const ProjectDetailPage = lazy(() =>
  import("#src/project/ui/ProjectDetailPage.tsx").then((module) => ({ default: module.ProjectDetailPage })),
)
const ProjectEditPage = lazy(() =>
  import("#src/project/ui/ProjectEditPage.tsx").then((module) => ({ default: module.ProjectEditPage })),
)

export function projectRoutesCreate(): RouteObject[] {
  return [
    { path: "/project", component: ProjectListPage },
    { path: "/org/:orgHandle/project", component: ProjectListPage },
    { path: "/team/:teamId/project", component: ProjectListPage },
    { path: "/org/:orgHandle/team/:teamId/project", component: ProjectListPage },
    { path: "/team/:teamId/project/create", component: ProjectCreatePage },
    { path: "/org/:orgHandle/team/:teamId/project/create", component: ProjectCreatePage },
    { path: "/project/:projectId/edit", component: ProjectEditPage },
    { path: "/org/:orgHandle/project/:projectId/edit", component: ProjectEditPage },
    { path: "/team/:teamId/project/:projectId/edit", component: ProjectEditPage },
    { path: "/org/:orgHandle/team/:teamId/project/:projectId/edit", component: ProjectEditPage },
    { path: "/project/:projectId", component: ProjectDetailPage },
    { path: "/org/:orgHandle/project/:projectId", component: ProjectDetailPage },
    { path: "/team/:teamId/project/:projectId", component: ProjectDetailPage },
    { path: "/org/:orgHandle/team/:teamId/project/:projectId", component: ProjectDetailPage },
  ]
}
