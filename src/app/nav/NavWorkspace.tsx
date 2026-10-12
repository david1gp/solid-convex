import { Show, splitProps } from "solid-js"
import { NavLinkButton } from "#src/app/nav/links/NavLinkButton.tsx"
import { WorkspaceListLinkNavButton } from "#src/app/nav/links/WorkspaceListLinkNavButton.tsx"
import { NavCrumbs } from "#src/app/nav/NavCrumbs.tsx"
import { workspaceNameGet } from "#src/workspace/workspace_ui/workspaceNameRecordSignal.ts"
import { urlWorkspaceView } from "#src/workspace/workspace_url/urlWorkspace.ts"
import { SetPageTitle } from "#ui/static/meta/SetPageTitle.jsx"
import type { MayHaveChildren } from "#ui/utils/MayHaveChildren.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"
import { NavBreadcrumbSeparator } from "./NavBreadcrumbSeparator.js"

export interface NavWorkspaceProps extends NavWorkspaceBreadcrumbsProps, MayHaveChildren, MayHaveClass {}

export function NavWorkspace(p: NavWorkspaceProps) {
  const [s, rest] = splitProps(p, ["children", "class"])
  return (
    <NavCrumbs class={p.class}>
      <NavWorkspaceBreadcrumbs {...rest}>{s.children}</NavWorkspaceBreadcrumbs>
    </NavCrumbs>
  )
}

export interface NavWorkspaceBreadcrumbsProps extends MayHaveChildren {
  workspaceHandle?: string
  getWorkspacePageTitle?: (workspaceName?: string) => string
}

export function NavWorkspaceBreadcrumbs(p: NavWorkspaceBreadcrumbsProps) {
  return (
    <>
      <Show when={p.getWorkspacePageTitle}>
        {(getPageTitle) => (
          <SetPageTitle title={getPageTitle()(p.workspaceHandle && workspaceNameGet(p.workspaceHandle))} />
        )}
      </Show>
      {/* 1 */}
      <WorkspaceListLinkNavButton />
      {/* 2 */}
      <Show when={p.workspaceHandle && p.workspaceHandle && workspaceNameGet(p.workspaceHandle)}>
        {(workspaceName) => (
          <>
            <NavBreadcrumbSeparator />
            <NavLinkButton href={p.workspaceHandle ? urlWorkspaceView(p.workspaceHandle) : ""} isActive={!p.children}>
              {workspaceName()}
            </NavLinkButton>
          </>
        )}
      </Show>
      {/* 3 */}
      <Show when={p.children}>
        {(getChildren) => (
          <>
            <NavBreadcrumbSeparator />
            {getChildren()}
          </>
        )}
      </Show>
    </>
  )
}
