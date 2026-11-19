import { splitProps } from "solid-js"
import { classesTextLink } from "#ui/classes/classesTextLink.js"
import { cn } from "cn"
import { type ComponentProps } from "@solidjs/web";

export interface BlueBulletPointProps extends ComponentProps<"span"> {}

/** A single blue link-colored bullet dot marker. */
export function BlueBulletPoint(p: BlueBulletPointProps) {
  const [s, rest] = splitProps(p, ["class"])
  return (
    <span
      class={cn(
        "text-sm select-none", // font
        "mr-1 mt-1.5", // spacing
        classesTextLink,
        s.class,
      )}
      style={{ "font-size": "0.5rem" }}
      aria-hidden={true}
      {...rest}
    >
      ●
    </span>
  )
}
