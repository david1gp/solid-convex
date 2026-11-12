import { pageDemoHref } from "#src/app/demos/pageDemoHref.ts"

/** Demo-internal links for team routes: global vs org-scoped variants stay inside /demos. */
export function teamPageDemoHref(
  view: "list" | "create" | "detail" | "edit",
  context: { orgHandle?: string; teamId?: string } = {},
): string {
  const { orgHandle, teamId } = context
  if (view === "list") {
    return orgHandle ? pageDemoHref("/org/:orgHandle/team", { orgHandle }) : pageDemoHref("/team")
  }
  if (view === "create") {
    return pageDemoHref("/org/:orgHandle/team/create", { orgHandle })
  }
  if (view === "detail") {
    return orgHandle
      ? pageDemoHref("/org/:orgHandle/team/:teamId", { orgHandle, teamId })
      : pageDemoHref("/team/:teamId", { teamId })
  }
  return orgHandle
    ? pageDemoHref("/org/:orgHandle/team/:teamId/edit", { orgHandle, teamId })
    : pageDemoHref("/team/:teamId/edit", { teamId })
}
