import type { Component } from "solid-js"
import { omit } from "solid-js"
import { classesDisabledDirectly } from "#ui/classes/classesDisabledDirectly.js"
import { type ButtonCvaProps, buttonCva2 } from "#ui/interactive/button/buttonCva.js"
import { classesButtonClickAnimation } from "#ui/interactive/button/classesButtonClickAnimation.js"
import { type ComponentProps } from "@solidjs/web"

export interface ButtonProps extends ComponentProps<"button">, ButtonCvaProps {}

/** Primary clickable button with variant styling and a click animation. */
export const Button: Component<ButtonProps> = (p) => {
  const rest = omit(p, "variant", "class", "type")
  return (
    <button
      class={buttonCva2(p.variant, classesButtonClickAnimation, p.disabled && classesDisabledDirectly, p.class)}
      type={p.type ?? "button"}
      {...rest}
    />
  )
}
