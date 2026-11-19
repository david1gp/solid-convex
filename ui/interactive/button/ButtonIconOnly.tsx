import { type Component, omit } from "solid-js"
import { classesDisabledDirectly } from "#ui/classes/classesDisabledDirectly.js"
import { type ButtonCvaProps, buttonCvaIconOnly } from "#ui/interactive/button/buttonCva.js"
import { buttonIconCva } from "#ui/interactive/button/buttonIconCva.js"
import { classesButtonClickAnimation } from "#ui/interactive/button/classesButtonClickAnimation.js"
import { Icon } from "#ui/static/icon/Icon.jsx"
import type { HasIcon } from "#ui/utils/HasIcon.js"
import type { HasTitle } from "#ui/utils/HasTitle.js"
import type { MayHaveChildren } from "#ui/utils/MayHaveChildren.js"
import { isDisabled } from "#ui/utils/MayHaveDisabledAccessor.js"
import { isLoading, type MayHaveIsLoading } from "#ui/utils/MayHaveIsLoading.js"
import { type ComponentProps } from "@solidjs/web"

export interface ButtonIconOnlyProps
  extends Omit<ComponentProps<"button">, "title">,
    ButtonCvaProps,
    HasTitle,
    HasIcon,
    MayHaveIsLoading,
    MayHaveChildren {
  iconRight?: boolean
}

/** Rounded icon-only button; pass a single icon and no children. */
export const ButtonIconOnly: Component<ButtonIconOnlyProps> = (p) => {
  const rest = omit(
    p,
    "variant",
    "class",
    "isLoading",
    "title",
    "icon",
    "iconRight",
    "iconClass",
    "type",
    "disabled",
    "children",
  )
  return (
    <button
      class={buttonCvaIconOnly(p.variant, isLoading(p), isDisabled(p), classesButtonClickAnimation, p.class)}
      title={p.title}
      type={p.type ?? "button"}
      {...rest}
    >
      {!p.iconRight && (
        <Icon
          path={p.icon}
          class={buttonIconCva(
            p.variant,
            p.children && "mr-2",
            p.isLoading && "animate-spin-faster",
            p.disabled && classesDisabledDirectly,
            p.iconClass,
          )}
        />
      )}
      {p.children}
      {p.iconRight && <Icon path={p.icon} class={buttonIconCva(p.variant, p.iconClass)} />}
    </button>
  )
}
