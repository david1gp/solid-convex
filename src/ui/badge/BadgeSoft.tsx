import { omit } from "solid-js"
import { classesBadgeSoft } from "#src/ui/badge/classesBadgeSoft.ts"
import { cn } from "cn"
import type { MayHaveChildrenAndClass } from "#ui/utils/MayHaveChildrenAndClass.ts"

export interface BasgeSoftProps extends MayHaveChildrenAndClass {}

export function BadgeSoft(p: BasgeSoftProps) {
  const rest = omit(p, "class")
  return <div class={cn(classesBadgeSoft, p.class)} {...rest} />
}
