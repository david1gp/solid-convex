import { classesActiveLink } from "#src/app/nav/links/classesActiveLink.ts"
import { buttonSize, buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { LinkButtonInternal } from "#ui/interactive/link/LinkButton.jsx"
import { classArr } from "#ui/utils/classArr.ts"
import type { HasChildren } from "#ui/utils/HasChildren.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

export interface NavLinkButtonProps extends HasChildren, MayHaveClass {
  href: string
  isActive: boolean
  icon?: string
}

/** Small breadcrumb link for the slim crumb bar under the sidebar layout. */
export function NavLinkButton(p: NavLinkButtonProps) {
  return (
    <LinkButtonInternal
      icon={p.icon}
      variant={buttonVariant.link}
      size={buttonSize.minimal}
      to={p.href}
      aria-current={!p.children ? "page" : undefined}
      aria-selected={!p.children ? "true" : undefined}
      role="tab"
      class={classArr("px-1 py-0.5 text-sm no-underline hover:underline", p.isActive && classesActiveLink, p.class)}
    >
      {p.children}
    </LinkButtonInternal>
  )
}
