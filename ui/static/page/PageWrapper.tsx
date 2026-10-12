import { classMerge } from "#ui/utils/classMerge.js"
import type { MayHaveChildren } from "#ui/utils/MayHaveChildren.js"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.js"

export interface PageWrapperProps extends MayHaveChildren, MayHaveClass {
  innerClass?: string
}

/** Full-height page container with centered inner content (transparent — the app shell provides the background). */
export function PageWrapper(p: PageWrapperProps) {
  return (
    <div class={classMerge("min-h-dvh w-full", p.class)}>
      <div class={classMerge("max-w-7xl mx-auto", "p-4 sm:p-6", p.innerClass)}>{p.children}</div>
    </div>
  )
}
