import { cn } from "cn"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

interface FieldProps extends MayHaveClass {
  heading: string
  headingClass?: string
  value: string
  valueClass?: string
}

export function MetaField(p: FieldProps) {
  return (
    <div class={cn("flex flex-col gap-1", p.class)}>
      <span class={cn("text-muted-foreground font-medium", p.headingClass)}>{p.heading}</span>
      <span class={cn("font-medium", p.valueClass)}>{p.value}</span>
    </div>
  )
}
