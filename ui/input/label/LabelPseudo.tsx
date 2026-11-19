import { type Component, omit } from "solid-js"
import { classesLabel } from "#ui/input/label/classesLabel.js"
import { cn } from "cn"
import { type ComponentProps } from "@solidjs/web"

/** Label-styled span for non-associated pseudo labels. */
export const LabelPseudo: Component<ComponentProps<"span">> = (p) => {
  const rest = omit(p, "class")
  return <span class={cn(classesLabel, p.class)} {...rest} />
}
