import { classesActiveLink } from "#src/app/nav/links/classesActiveLink.ts"
import { classMerge } from "#ui/utils/classMerge.ts"
import type { MayHaveClassAndChildren } from "#ui/utils/MayHaveClassAndChildren.ts"

export interface LinkLikeTextProps extends MayHaveClassAndChildren {
  isActive?: boolean
}

export function LinkLikeNavText(p: LinkLikeTextProps) {
  return (
    <span
      class={classMerge("p-3 font-medium", p.isActive && classesActiveLink, p.class)}
      aria-current={p.isActive ? "page" : undefined}
    >
      {p.children}
    </span>
  )
}
