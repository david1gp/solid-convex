import type { Component } from "solid-js"
import { splitProps } from "solid-js"
import { classesLabel } from "#ui/input/label/classesLabel.js"
import { cn } from "cn"
import { type ComponentProps } from "@solidjs/web";

/** Styled native label element for form fields. */
export const Label: Component<ComponentProps<"label">> = (p) => {
  const [s, rest] = splitProps(p, ["class"])
  // biome-ignore lint/a11y/noLabelWithoutControl: generic wrapper; callers pass `for` via props
  return <label class={cn(classesLabel, s.class)} {...rest} />
}
