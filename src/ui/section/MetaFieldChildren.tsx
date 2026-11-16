import { cn } from "cn"
import type { HasChildren } from "#ui/utils/HasChildren.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

interface FieldChildrenProps extends MayHaveClass, HasChildren {
  heading: string
  headingClass?: string
}

export function MetaFieldChildren(p: FieldChildrenProps) {
  return (
    <div class={cn("flex flex-col gap-1", p.class)}>
      <span class={cn("text-muted-foreground font-medium", p.headingClass)}>{p.heading}</span>
      {p.children}
    </div>
  )
}
