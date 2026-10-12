import type { JSX } from "solid-js"
import { classMerge } from "#ui/utils/classMerge.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

export interface NavCrumbsProps extends MayHaveClass {
  children: JSX.Element
}

/** Slim in-content breadcrumb trail replacing the old top navbar. */
export function NavCrumbs(p: NavCrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      class={classMerge("mb-6 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm", p.class)}
    >
      {p.children}
    </nav>
  )
}
