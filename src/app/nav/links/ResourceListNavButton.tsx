import { classesActiveLink } from "#src/app/nav/links/classesActiveLink.ts"
import { appTab, appTabIcon } from "#src/app/tabs/appTab.ts"
import { appTabGetText } from "#src/app/tabs/appTabGetText.ts"
import { urlResourceList } from "#src/resource/url/urlResource.ts"
import { buttonSize, buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { classArr } from "#ui/utils/classArr.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

export interface ResourceListLinkButtonProps extends MayHaveClass {
  isActive?: boolean
}

export function ResourceListNavButton(p: ResourceListLinkButtonProps) {
  return (
    <LinkButtonInternal
      icon={appTabIcon[appTab.resource]}
      variant={buttonVariant.link}
      size={buttonSize.minimal}
      to={urlResourceList()}
      class={classArr("px-1 py-0.5 text-sm no-underline hover:underline", p.isActive && classesActiveLink, p.class)}
      aria-current={p.isActive ? "page" : undefined}
      aria-selected={p.isActive ? "true" : undefined}
      role="tab"
    >
      {appTabGetText(appTab.resource)}
    </LinkButtonInternal>
  )
}
