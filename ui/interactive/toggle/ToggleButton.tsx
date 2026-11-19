import { omit } from "solid-js"
import { ButtonIcon } from "#ui/interactive/button/ButtonIcon.jsx"
import type { SignalObject } from "#ui/utils/createSignalObject.js"
import type { MayHaveChildren } from "#ui/utils/MayHaveChildren.js"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.js"
import { isDisabled, type MayHaveDisabledAccessor } from "#ui/utils/MayHaveDisabledAccessor.js"
import { type ComponentProps } from "@solidjs/web"

/**
 * https://github.com/radix-ui/primitives/blob/main/packages/react/toggle/src/Toggle.tsx
 * https://github.com/mui/base-ui/blob/master/packages/react/src/toggle/useToggle.ts
 */
export interface ToggleButtonProps
  extends ToggleButtonStateProps,
    MayHaveClass,
    MayHaveChildren,
    Omit<MayHaveDisabledAccessor, "disabled">,
    Omit<ComponentProps<"button">, "class"> {
  title: string
  onClick?: (e: MouseEvent & { currentTarget: HTMLButtonElement; target: Element }) => void
  onPressedChange?: (pressed: boolean) => void
}

type ToggleButtonStateProps = {
  pressedSignal: SignalObject<boolean>
}

/** Button toggling a pressed signal on click. */
export function ToggleButton(p: ToggleButtonProps) {
  const rest = omit(p, "title", "pressedSignal", "disabled", "onPressedChange", "onClick", "children")
  return (
    <ButtonIcon
      type="button"
      title={p.title}
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
      {p.children}
    </ButtonIcon>
  )
}

function togglePressed(
  s: Pick<ToggleButtonProps, "disabled" | "title" | "pressedSignal" | "onPressedChange" | "onClick">,
): boolean {
  const prev = s.pressedSignal.get()
  const next = !prev
  s.pressedSignal.set(next)
  return next
}
