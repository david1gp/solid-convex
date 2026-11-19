import { type Component, omit } from "solid-js"
import { classesDisabledDirectly } from "#ui/classes/classesDisabledDirectly.js"
import { type ButtonCvaProps, buttonCvaIconOnly } from "#ui/interactive/button/buttonCva.js"
import { buttonIconCva } from "#ui/interactive/button/buttonIconCva.js"
import { classesButtonClickAnimation } from "#ui/interactive/button/classesButtonClickAnimation.js"
import { Icon } from "#ui/static/icon/Icon.jsx"
import type { SignalObject } from "#ui/utils/createSignalObject.js"
import type { HasIcon } from "#ui/utils/HasIcon.js"
import type { HasTitle } from "#ui/utils/HasTitle.js"
import type { MayHaveChildren } from "#ui/utils/MayHaveChildren.js"
import { isDisabled } from "#ui/utils/MayHaveDisabledAccessor.js"
import { isLoading, type MayHaveIsLoading } from "#ui/utils/MayHaveIsLoading.js"
import { type ComponentProps } from "@solidjs/web"

export interface ToggleButtonIconOnlyProps
  extends Omit<ComponentProps<"button">, "title" | "onClick">,
    ButtonCvaProps,
    HasTitle,
    HasIcon,
    MayHaveIsLoading,
    MayHaveChildren {
  pressedSignal: SignalObject<boolean>
  onPressedChange?: (pressed: boolean) => void
  onClick?: (e: MouseEvent & { currentTarget: HTMLButtonElement; target: Element }) => void
}

/** Icon-only button toggling a pressed signal. */
export const ToggleButtonIconOnly: Component<ToggleButtonIconOnlyProps> = (p) => {
  const rest = omit(
    p,
    "variant",
    "class",
    "isLoading",
    "title",
    "icon",
    "iconClass",
    "type",
    "disabled",
    "pressedSignal",
    "onPressedChange",
    "onClick",
    "children",
  )
  return (
    <button
      class={buttonCvaIconOnly(p.variant, isLoading(p), isDisabled(p), classesButtonClickAnimation, p.class)}
      title={p.title}
      type={p.type ?? "button"}
      aria-pressed={p.pressedSignal.get() ? "true" : "false"}
      data-state={p.pressedSignal.get() ? "on" : "off"}
      data-disabled={isDisabled(p)}
      onClick={(e) => {
        const next = togglePressed(p)
        if (p.onPressedChange) {
          p.onPressedChange(next)
        }
        if (p.onClick) p.onClick(e)
      }}
      {...rest}
    >
      <Icon
        path={p.icon}
        class={buttonIconCva(
          p.variant,
          p.isLoading && "animate-spin-faster",
          p.disabled && classesDisabledDirectly,
          p.iconClass,
        )}
      />
      {p.children}
    </button>
  )
}

function togglePressed(
  s: Pick<ToggleButtonIconOnlyProps, "disabled" | "title" | "pressedSignal" | "onPressedChange" | "onClick">,
): boolean {
  const next = !s.pressedSignal.get()
  s.pressedSignal.set(next)
  return next
}
