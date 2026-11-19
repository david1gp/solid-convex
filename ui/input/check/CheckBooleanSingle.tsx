import { mdiCheckboxBlankCircleOutline } from "@adaptive-ds/mdi/mdiCheckboxBlankCircleOutline.js"
import { mdiCheckboxMarkedCircle } from "@adaptive-ds/mdi/mdiCheckboxMarkedCircle.js"
import { ButtonIcon } from "#ui/interactive/button/ButtonIcon.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.js"
import { cn } from "cn"
import type { SignalObject } from "#ui/utils/createSignalObject.js"
import type { MayHaveButtonVariant } from "#ui/utils/MayHaveButtonVariant.js"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.js"
import type { MayHaveDisabled } from "#ui/utils/MayHaveDisabled.js"
import type { MayHaveId } from "#ui/utils/MayHaveId.js"
import type { MayHaveInnerClass } from "#ui/utils/MayHaveInnerClass.js"

export interface CheckBooleanSingleProps
  extends MayHaveId,
    MayHaveButtonVariant,
    MayHaveClass,
    MayHaveInnerClass,
    MayHaveDisabled {
  valueSignal: SignalObject<boolean>
  valueText: (value: boolean) => string
  optionClass?: string
}

/** Single toggle button bound to a boolean signal. */
export function CheckBooleanSingle(p: CheckBooleanSingleProps) {
  const label = () => p.valueText(p.valueSignal.get())
  const isSelected = () => p.valueSignal.get()

  return (
    <div
      id={p.id}
      class={cn(
        "group border border-input",
        "px-2 py-2",
        "ring-offset-background",
        "rounded-md",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        "flex flex-col justify-center", // layout
        p.class,
      )}
    >
      <ButtonIcon
        role="option"
        aria-selected={isSelected() ? "true" : "false"}
        icon={isSelected() ? mdiCheckboxMarkedCircle : mdiCheckboxBlankCircleOutline}
        onClick={() => toggleOption(p)}
        variant={p.variant ?? buttonVariant.filled}
        class={cn("justify-start text-left", p.innerClass, p.optionClass)}
        disabled={p.disabled}
      >
        {label()}
      </ButtonIcon>
    </div>
  )
}

function toggleOption(p: CheckBooleanSingleProps) {
  p.valueSignal.set(!p.valueSignal.get())
}
