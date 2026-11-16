import { type Component, type ComponentProps, splitProps } from "solid-js"
import { classesLabel } from "#ui/input/label/classesLabel.js"
import { cn } from "cn"

/** Label-styled span for non-associated pseudo labels. */
export const LabelPseudo: Component<ComponentProps<"span">> = (p) => {
  const [s, rest] = splitProps(p, ["class"])
  return <span class={cn(classesLabel, s.class)} {...rest} />
}
