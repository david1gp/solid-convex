import { pageDemoHref } from "#src/app/demos/pageDemoHref.ts"

export interface NotePageDemoContext {
  orgHandle?: string
  teamId?: string
  projectId?: string
  noteId?: string
}

/** Demo-internal links for note routes: scope variants stay inside /demos. */
export function notePageDemoHref(
  view: "list" | "create" | "detail" | "edit",
  context: NotePageDemoContext = {},
): string {
  const { orgHandle, teamId, projectId, noteId } = context
  const tail =
    view === "list"
      ? "note"
      : view === "create"
        ? "note/create"
        : view === "detail"
          ? "note/:noteId"
          : "note/:noteId/edit"
  // One call site: the route union keeps every scope variant inside /demos at
  // runtime, while the cast bridges the per-route literal param typing. All
  // four values are always passed; unused slots are ignored by pageDemoHref.
  const route = (
    orgHandle && teamId && projectId
      ? `/org/:orgHandle/team/:teamId/project/:projectId/${tail}`
      : teamId && projectId
        ? `/team/:teamId/project/:projectId/${tail}`
        : orgHandle && projectId
          ? `/org/:orgHandle/project/:projectId/${tail}`
          : projectId
            ? `/project/:projectId/${tail}`
            : orgHandle && teamId
              ? `/org/:orgHandle/team/:teamId/${tail}`
              : teamId
                ? `/team/:teamId/${tail}`
                : orgHandle
                  ? `/org/:orgHandle/${tail}`
                  : `/${tail}`
  ) as "/org/:orgHandle/team/:teamId/project/:projectId/note/:noteId"
  return pageDemoHref(route, { orgHandle, teamId, projectId, noteId })
}
