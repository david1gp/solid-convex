import { cn } from "cn"
import type { HasChildren } from "#ui/utils/HasChildren.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

export interface TextWithHeadderVerticalProps extends MayHaveClass, HasChildren {
  text: string
  textClass?: string
}

export function TextWithHeadderVertical(p: TextWithHeadderVerticalProps) {
  return (
    <div class={p.class}>
      <div class={cn("text-muted-foreground font-medium text-sm", p.textClass)}>{p.text}</div>
      {p.children}
    </div>
  )
}
