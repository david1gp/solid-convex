import { mdiLoading } from "@adaptive-ds/mdi/mdiLoading.js"
import { type Component, omit } from "solid-js"
import { Button } from "#ui/interactive/button/Button.jsx"
import type { ButtonCvaProps, ButtonVariant } from "#ui/interactive/button/buttonCva.js"
import { buttonIconCva } from "#ui/interactive/button/buttonIconCva.js"
import { classesButtonClickAnimation } from "#ui/interactive/button/classesButtonClickAnimation.js"
import { Icon } from "#ui/static/icon/Icon.jsx"
import { cn } from "cn"
import { type ComponentProps } from "@solidjs/web"

export interface ButtonIconProps extends ComponentProps<"button">, ButtonCvaProps {
  // icon
  icon?: string
  iconRight?: string
  iconClass?: string
  // loading
  isLoading?: boolean
  // validating
  validationMessage?: string
  validationVariant?: ButtonVariant
  validationIcon?: string
}

/** Button with icon, loading, and validation states. */
export const ButtonIcon: Component<ButtonIconProps> = (p) => {
  const rest = omit(
    p,
    "icon",
    "iconRight",
    "iconClass",
    "isLoading",
    "validationMessage",
    "validationVariant",
    "validationIcon",
    "variant",
    "class",
    "disabled",
    "onClick",
    "children",
  )
  const onClick2 = (e: any) => {
    if (p.disabled) return
    if (p.isLoading) return
    if (p.validationMessage) return
    if (p.onClick && typeof p.onClick === "function") {
      p.onClick(e)
    }
  }
  return (
    <Button
      class={cn(classesButtonClickAnimation, (p.isLoading || !!p.validationMessage) && "cursor-not-allowed", p.class)}
      variant={p.validationMessage ? p.validationVariant : p.variant}
      onClick={onClick2}
      disabled={p.disabled}
      aria-disabled={p.isLoading || !!p.validationMessage ? "true" : "false"}
      {...rest}
    >
      {(p.isLoading || p.validationMessage || p.icon) && (
        <Icon
          path={(p.isLoading ? mdiLoading : p.validationMessage ? p.validationIcon : (p.icon ?? mdiLoading))!}
          class={buttonIconCva(
            p.validationMessage ? p.validationVariant : p.variant,
            p.children && "mr-2",
            p.isLoading && "animate-spin",
            p.iconClass,
          )}
        />
      )}
      {p.validationMessage ? p.validationMessage : p.children}
      {!p.isLoading && !p.validationMessage && p.iconRight && (
        <Icon
          path={p.iconRight}
          class={buttonIconCva(
            p.validationMessage ? p.validationVariant : p.variant,
            p.children && "ml-2",
            p.isLoading && "animate-spin",
            p.iconClass,
          )}
        />
      )}
    </Button>
  )
}
