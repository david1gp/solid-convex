import { lazy } from "solid-js"
import type { RouteObject } from "#ui/utils/RouteConfig.ts"

const NotePage = lazy(() => import("#src/note/ui/NotePage.tsx").then((module) => ({ default: module.NotePage })))

export function noteRoutesCreate(): RouteObject[] {
  return [
    { path: "/note/create", component: NotePage },
    { path: "/org/:orgHandle/note/create", component: NotePage },
    { path: "/team/:teamId/note/create", component: NotePage },
    { path: "/org/:orgHandle/team/:teamId/note/create", component: NotePage },
    { path: "/project/:projectId/note/create", component: NotePage },
    { path: "/org/:orgHandle/project/:projectId/note/create", component: NotePage },
    { path: "/team/:teamId/project/:projectId/note/create", component: NotePage },
    { path: "/org/:orgHandle/team/:teamId/project/:projectId/note/create", component: NotePage },

    { path: "/note/:noteId/edit", component: NotePage },
    { path: "/org/:orgHandle/note/:noteId/edit", component: NotePage },
    { path: "/team/:teamId/note/:noteId/edit", component: NotePage },
    { path: "/org/:orgHandle/team/:teamId/note/:noteId/edit", component: NotePage },
    { path: "/project/:projectId/note/:noteId/edit", component: NotePage },
    { path: "/org/:orgHandle/project/:projectId/note/:noteId/edit", component: NotePage },
    { path: "/team/:teamId/project/:projectId/note/:noteId/edit", component: NotePage },
    { path: "/org/:orgHandle/team/:teamId/project/:projectId/note/:noteId/edit", component: NotePage },

    { path: "/note/:noteId", component: NotePage },
    { path: "/org/:orgHandle/note/:noteId", component: NotePage },
    { path: "/team/:teamId/note/:noteId", component: NotePage },
    { path: "/org/:orgHandle/team/:teamId/note/:noteId", component: NotePage },
    { path: "/project/:projectId/note/:noteId", component: NotePage },
    { path: "/org/:orgHandle/project/:projectId/note/:noteId", component: NotePage },
    { path: "/team/:teamId/project/:projectId/note/:noteId", component: NotePage },
    { path: "/org/:orgHandle/team/:teamId/project/:projectId/note/:noteId", component: NotePage },

    { path: "/note", component: NotePage },
    { path: "/org/:orgHandle/note", component: NotePage },
    { path: "/team/:teamId/note", component: NotePage },
    { path: "/org/:orgHandle/team/:teamId/note", component: NotePage },
    { path: "/project/:projectId/note", component: NotePage },
    { path: "/org/:orgHandle/project/:projectId/note", component: NotePage },
    { path: "/team/:teamId/project/:projectId/note", component: NotePage },
    { path: "/org/:orgHandle/team/:teamId/project/:projectId/note", component: NotePage },
  ]
}
