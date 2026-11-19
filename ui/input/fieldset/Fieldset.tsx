import type { Component, Element as JSXElement } from "solid-js"
import { omit } from "solid-js"
import { cn } from "cn"
import type { MayHaveChildren } from "#ui/utils/MayHaveChildren.js"
import type { MayHaveSubtitle } from "#ui/utils/MayHaveSubtitle.js"
import type { MayHaveTitle } from "#ui/utils/MayHaveTitle.js"
import { classesFieldset } from "./classesFieldset.js"

export interface FieldsetProps extends MayHaveChildren, MayHaveTitle, MayHaveSubtitle {
  class?: string
  titleChildren?: JSXElement
}

/** Fieldset grouping inputs under a titled legend. */
export const Fieldset: Component<FieldsetProps> = (p) => {
  const rest = omit(p, "children", "title", "titleClass", "titleChildren", "subtitleClass", "class")

  return (
    <fieldset class={cn(classesFieldset, p.class)} {...rest}>
      <legend class={cn("px-1", p.titleClass)}>{p.titleChildren ?? p.title}</legend>
      {p.children}
    </fieldset>
  )
}
