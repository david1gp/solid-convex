import { createLink } from "@tanstack/solid-router"
import { omit } from "solid-js"
import { buttonCvaIconOnly } from "#ui/interactive/button/buttonCva.js"
import { buttonIconCva } from "#ui/interactive/button/buttonIconCva.js"
import { classesButtonClickAnimation } from "#ui/interactive/button/classesButtonClickAnimation.js"
import type { ButtonAnchorProps } from "#ui/interactive/link/LinkButtonProps.jsx"
import { Icon } from "#ui/static/icon/Icon.jsx"
import { isLoading } from "#ui/utils/MayHaveIsLoading.js"

/** Shared styled icon-only button-anchor; base for both link variants. */
function ButtonIconOnlyAnchor(p: ButtonAnchorProps) {
  const rest = omit(
    p,
    "class",
    "variant",
    "newTab",
    "isLoading",
    "icon",
    "iconRight",
    "iconClass",
    "children",
    "target",
    "rel",
  )
  return (
    <a
      class={buttonCvaIconOnly(
        p.variant,
        isLoading({ isLoading: p.isLoading }),
        false,
        classesButtonClickAnimation,
        "break-all", // line breaks for long links
        p.class,
      )}
      target={p.newTab ? "_blank" : p.target}
      rel={p.newTab ? "noopener noreferrer" : p.rel}
      {...rest}
    >
      {p.icon && <Icon path={p.icon} class={buttonIconCva(p.variant, p.children && "mr-2", p.iconClass)} />}
      {p.children}
      {p.iconRight && <Icon path={p.iconRight} class={buttonIconCva(p.variant, p.children && "ml-2", p.iconClass)} />}
    </a>
  )
}

/** Internal icon-only button link — typed `to`, client-side nav + preload. Needs a RouterProvider. */
export const LinkButtonIconOnlyInternal = createLink(ButtonIconOnlyAnchor)

/** External icon-only button link — plain `<a>` for external/runtime URLs. */
export function LinkButtonIconOnlyExternal(p: ButtonAnchorProps & { href: string }) {
  return <ButtonIconOnlyAnchor {...p} />
}
