import type { Component } from "solid-js"
import { omit } from "solid-js"
import { classesInput } from "#ui/input/input/classesInput.js"
import { cn } from "cn"
import { type ComponentProps } from "@solidjs/web"

/** Styled native text input element. */
export const Input: Component<ComponentProps<"input">> = (p) => {
  const rest = omit(p, "class")
  return <input class={cn(classesInput, p.class)} dir="auto" {...rest} />
}
