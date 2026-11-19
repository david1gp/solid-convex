import { cn } from "cn"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"
import { type JSX } from "@solidjs/web";

export interface NavCrumbsProps extends MayHaveClass {
  children: JSX.Element
}

/** Slim in-content breadcrumb trail replacing the old top navbar. */
export function NavCrumbs(p: NavCrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" class={cn("mb-6 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm", p.class)}>
      {p.children}
    </nav>
  )
}
