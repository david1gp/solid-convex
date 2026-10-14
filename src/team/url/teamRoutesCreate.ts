import { lazy } from "solid-js"
import type { RouteObject } from "#ui/utils/RouteConfig.ts"

const TeamListPage = lazy(() =>
  import("#src/team/ui/TeamListPage.tsx").then((module) => ({ default: module.TeamListPage })),
)
const TeamCreatePage = lazy(() =>
  import("#src/team/ui/TeamCreatePage.tsx").then((module) => ({ default: module.TeamCreatePage })),
)
const TeamDetailPage = lazy(() =>
  import("#src/team/ui/TeamDetailPage.tsx").then((module) => ({ default: module.TeamDetailPage })),
)
const TeamEditPage = lazy(() =>
  import("#src/team/ui/TeamEditPage.tsx").then((module) => ({ default: module.TeamEditPage })),
)

export function teamRoutesCreate(): RouteObject[] {
  return [
    { path: "/team", component: TeamListPage },
    { path: "/team/:teamId", component: TeamDetailPage },
    { path: "/team/:teamId/edit", component: TeamEditPage },
    { path: "/org/:orgHandle/team", component: TeamListPage },
    { path: "/org/:orgHandle/team/create", component: TeamCreatePage },
    { path: "/org/:orgHandle/team/:teamId", component: TeamDetailPage },
    { path: "/org/:orgHandle/team/:teamId/edit", component: TeamEditPage },
  ]
}
