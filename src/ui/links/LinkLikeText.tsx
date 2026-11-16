import { cn } from "cn"
import type { MayHaveClassAndChildren } from "#ui/utils/MayHaveClassAndChildren.ts"

export function LinkLikeText(p: MayHaveClassAndChildren) {
  return <span class={cn("p-3 font-medium", p.class)}>{p.children}</span>
}
