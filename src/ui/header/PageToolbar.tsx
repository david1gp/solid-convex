import { classMerge } from "#ui/utils/classMerge.ts"
import type { MayHaveChildrenAndClass } from "#ui/utils/MayHaveChildrenAndClass.ts"

export interface PageToolbarProps extends MayHaveChildrenAndClass {}

/** Filter/action row below the page header (house toolbar anatomy). */
export function PageToolbar(p: PageToolbarProps) {
  return (
    <div class={classMerge("flex flex-wrap items-center gap-2 border-b border-border px-4 py-2 md:px-6", p.class)}>
      {p.children}
    </div>
  )
}
