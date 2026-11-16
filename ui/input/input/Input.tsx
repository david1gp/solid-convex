import type { Component, ComponentProps } from "solid-js"
import { splitProps } from "solid-js"
import { classesInput } from "#ui/input/input/classesInput.js"
import { cn } from "cn"

/** Styled native text input element. */
export const Input: Component<ComponentProps<"input">> = (p) => {
  const [s, rest] = splitProps(p, ["class"])
  return <input class={cn(classesInput, s.class)} dir="auto" {...rest} />
}
