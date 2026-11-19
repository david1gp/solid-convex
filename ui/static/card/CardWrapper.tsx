import { omit } from "solid-js"
import { classesCardWrapperP4 } from "#ui/static/card/classesCardWrapper.js"
import { cn } from "cn"
import { type ComponentProps } from "@solidjs/web"

export interface CardWrapperProps extends ComponentProps<"article"> {
  id?: string
}

/** Styled card container wrapping article content. */
export function CardWrapper(p: CardWrapperProps) {
  const rest = omit(p, "id", "class")
  return <article id={p.id} class={cn(classesCardWrapperP4, p.class)} {...rest} />
}
