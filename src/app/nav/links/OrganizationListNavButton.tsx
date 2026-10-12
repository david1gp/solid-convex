import { classesActiveLink } from "#src/app/nav/links/classesActiveLink.ts"
import { urlOrgList } from "#src/org/org_url/urlOrg.ts"
import { ttt } from "#ui/i18n/ttt.ts"
import { buttonSize, buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { classArr } from "#ui/utils/classArr.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

export interface OrganizationListLinkButtonProps extends MayHaveClass {
  isActive?: boolean
}

export function OrganizationListNavButton(p: OrganizationListLinkButtonProps) {
  return (
    <LinkButtonInternal
      variant={buttonVariant.link}
      size={buttonSize.minimal}
      to={urlOrgList()}
      class={classArr("px-1 py-0.5 text-sm no-underline hover:underline", p.isActive && classesActiveLink, p.class)}
      aria-current={p.isActive ? "page" : undefined}
      aria-selected={p.isActive ? "true" : undefined}
      role="tab"
    >
      {ttt("Organizations")}
    </LinkButtonInternal>
  )
}
