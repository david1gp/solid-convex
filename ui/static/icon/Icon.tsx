import { cn } from "cn"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.js"

export interface IconProps extends MayHaveClass {
  path: string
  title?: string
  color?: string | null
}

/** Renders an SVG icon from an MDI path string. */
export function Icon(p: IconProps) {
  return (
    <svg
      viewBox={"0 0 24 24"}
      role="img"
      aria-label={p.title}
      aria-hidden={!p.title}
      stroke-width={0.5}
      class={cn("size-6 shrink-0 align-middle fill-current", p.class)}
    >
      <path d={p.path} />
    </svg>
  )
}
