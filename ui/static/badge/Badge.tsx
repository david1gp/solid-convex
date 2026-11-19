import type { Component } from "solid-js"
import { omit } from "solid-js"
import { type BadgeVariant, badgeCva1 } from "#ui/static/badge/badgeCva.jsx"
import { type ComponentProps } from "@solidjs/web"

export interface BadgeProps extends ComponentProps<"div"> {
  variant?: BadgeVariant
}

/** Small styled badge label with variant. */
export const Badge: Component<BadgeProps> = (p) => {
  const rest = omit(p, "variant", "class")
  return <div class={badgeCva1(p.variant, p.class)} {...rest} />
}
