import Popover, { type TriggerProps } from "@corvu-next/popover"
import { createSignal, type Component, omit } from "solid-js"
import { classesDisabledDirectly } from "#ui/classes/classesDisabledDirectly.js"
import { type ButtonCvaProps, buttonCvaIconOnly } from "#ui/interactive/button/buttonCva.js"
import { buttonIconCva } from "#ui/interactive/button/buttonIconCva.js"
import { classesButtonClickAnimation } from "#ui/interactive/button/classesButtonClickAnimation.js"
import { classesPopoverContentMerge } from "#ui/interactive/popover/classesPopoverContent.js"
import { Icon } from "#ui/static/icon/Icon.jsx"
import type { HasIcon } from "#ui/utils/HasIcon.js"
import type { HasTitle } from "#ui/utils/HasTitle.js"
import type { MayHaveChildren } from "#ui/utils/MayHaveChildren.js"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.js"
import type { MayHaveInnerClass } from "#ui/utils/MayHaveInnerClass.js"
import { isLoading, type MayHaveIsLoading } from "#ui/utils/MayHaveIsLoading.js"
import { type ComponentProps } from "@solidjs/web"

export interface CorvuPopoverIconProps
  extends Omit<ComponentProps<"button">, "title" | "class" | "ref" | "type">,
    ButtonCvaProps,
    HasIcon,
    HasTitle,
    MayHaveClass,
    MayHaveInnerClass,
    MayHaveChildren,
    MayHaveIsLoading,
    Pick<TriggerProps, "ref" | "type"> {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/** Popover anchored to an icon-only trigger button. */
export const CorvuPopoverIcon: Component<CorvuPopoverIconProps> = (p) => {
  const [trigger, setTrigger] = createSignal<HTMLElement>()
  const rest = omit(
    p,
    "variant",
    "class",
    "isLoading",
    "disabled",
    "title",
    "icon",
    "iconClass",
    "innerClass",
    "children",
    "open",
    "onOpenChange",
    "ref",
  )

  return (
    <Popover
      finalFocusEl={trigger()}
      floatingOptions={{
        offset: 8,
        flip: true,
        shift: true,
      }}
      open={p.open}
      onOpenChange={p.onOpenChange}
    >
      <Popover.Trigger
        ref={(element) => {
          setTrigger(element)
          if (typeof p.ref === "function") p.ref(element)
        }}
        class={buttonCvaIconOnly(p.variant, isLoading(p), p.disabled === "" || p.disabled === true, classesButtonClickAnimation, p.class)}
        title={p.title}
        {...rest}
      >
        <Icon
          path={p.icon}
          class={buttonIconCva(
            p.variant,
            isLoading(p) && "animate-spin-faster",
            p.disabled && classesDisabledDirectly,
            p.iconClass,
          )}
        />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content class={classesPopoverContentMerge(p.innerClass)}>{p.children}</Popover.Content>
      </Popover.Portal>
    </Popover>
  )
}
