import { cn } from "cn"
import type { MayHaveChildren } from "#ui/utils/MayHaveChildren.js"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.js"

export interface PageWrapperProps extends MayHaveChildren, MayHaveClass {
  innerClass?: string
}

/** Full-height page container with full-width house body (transparent — the app shell provides the background). */
export function PageWrapper(p: PageWrapperProps) {
  return (
    <div class={cn("min-h-dvh w-full", p.class)}>
      <div class={cn("w-full", "px-4 py-4 md:px-6", p.innerClass)}>{p.children}</div>
    </div>
  )
}
