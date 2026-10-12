import { classesActiveLink } from "#src/app/nav/links/classesActiveLink.ts"
import { urlWorkspaceList } from "#src/workspace/workspace_url/urlWorkspace.ts"
import { ttt } from "#ui/i18n/ttt.ts"
import { buttonSize, buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { classArr } from "#ui/utils/classArr.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

export interface WorkspaceListLinkNavButtonProps extends MayHaveClass {
  isActive?: boolean
}

export function WorkspaceListLinkNavButton(p: WorkspaceListLinkNavButtonProps) {
  return (
    <LinkButtonInternal
      variant={buttonVariant.link}
      size={buttonSize.minimal}
      to={urlWorkspaceList()}
      class={classArr("px-1 py-0.5 text-sm no-underline hover:underline", p.isActive && classesActiveLink, p.class)}
      aria-current={p.isActive ? "page" : undefined}
      aria-selected={p.isActive ? "true" : undefined}
      role="tab"
    >
      {ttt("Workspaces")}
    </LinkButtonInternal>
  )
}
