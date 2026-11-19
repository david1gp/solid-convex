import { omit } from "solid-js"
import { cn } from "cn"
import { type ComponentProps } from "@solidjs/web"

export interface BlackBulletPointProps extends ComponentProps<"span"> {}

/** A single black bullet dot marker. */
export function BlackBulletPoint(p: BlackBulletPointProps) {
  const rest = omit(p, "class")
  return (
    <span
      class={cn(
        "text-sm select-none", // font
        "mt-1.5 mr-1.5", // spacing
        "text-black dark:text-white", // color
        p.class,
      )}
      style={{ "font-size": "0.5rem" }}
      aria-hidden="true"
      {...rest}
    >
      ●
    </span>
  )
}
