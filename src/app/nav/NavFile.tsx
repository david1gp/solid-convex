import { Show, omit } from "solid-js"
import { NavLinkButton } from "#src/app/nav/links/NavLinkButton.tsx"
import { ResourceListNavButton } from "#src/app/nav/links/ResourceListNavButton.tsx"
import { NavBreadcrumbSeparator } from "#src/app/nav/NavBreadcrumbSeparator.tsx"
import { NavCrumbs } from "#src/app/nav/NavCrumbs.tsx"
import { fileNameGet, fileNameRecordSignalRegisterHandler } from "#src/file/ui/fileNameRecordSignal.ts"
import { urlFileEdit } from "#src/file/url/urlFile.ts"
import type { HasResourceId } from "#src/resource/model/HasResourceId.ts"
import { resourceNameGet, resourceNameRecordSignalRegisterHandler } from "#src/resource/ui/resourceNameRecordSignal.ts"
import { urlResourceView } from "#src/resource/url/urlResource.ts"
import { SetPageTitle } from "#ui/static/meta/SetPageTitle.jsx"
import type { MayHaveChildren } from "#ui/utils/MayHaveChildren.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

export interface NavFileProps extends NavFileBreadcrumbsProps, MayHaveChildren, MayHaveClass {}

export function NavFile(p: NavFileProps) {
  const rest = omit(p, "children", "class")
  return (
    <NavCrumbs class={p.class}>
      <NavFileBreadcrumbs {...rest}>{p.children}</NavFileBreadcrumbs>
    </NavCrumbs>
  )
}

export interface NavFileBreadcrumbsProps extends HasResourceId, MayHaveChildren {
  fileId?: string
  getFilePageTitle?: (resourceName?: string, fileName?: string) => string
}

function NavFileBreadcrumbs(p: NavFileBreadcrumbsProps) {
  resourceNameRecordSignalRegisterHandler()
  fileNameRecordSignalRegisterHandler()
  return (
    <>
      <Show when={p.getFilePageTitle}>
        {(getPageTitle) => <SetPageTitle title={getPageTitle()(p.fileId && fileNameGet(p.fileId))} />}
      </Show>
      {/* 1 */}
      <ResourceListNavButton isActive={false} />
      {/* 2 */}
      <NavBreadcrumbSeparator />
      <NavLinkButton href={urlResourceView(p.resourceId)} isActive={!p.children && !p.fileId}>
        {resourceNameGet(p.resourceId) || p.resourceId}
      </NavLinkButton>
      {/* 3 */}
      <Show when={p.fileId && fileNameGet(p.fileId)}>
        {(fileName) => (
          <>
            <NavBreadcrumbSeparator />
            <NavLinkButton href={p.fileId ? urlFileEdit(p.resourceId, p.fileId) : ""} isActive={!p.children}>
              {fileName()}
            </NavLinkButton>
          </>
        )}
      </Show>
      {/* 4 */}
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
