import { type ComponentProps, splitProps } from "solid-js"
import { classesCardWrapperP4 } from "#ui/static/card/classesCardWrapper.js"
import { cn } from "cn"

export interface CardWrapperProps extends ComponentProps<"article"> {
  id?: string
}

/** Styled card container wrapping article content. */
export function CardWrapper(p: CardWrapperProps) {
  const [s, rest] = splitProps(p, ["id", "class"])
  return <article id={s.id} class={cn(classesCardWrapperP4, s.class)} {...rest} />
}
