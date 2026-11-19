import { mdiMinus } from "@adaptive-ds/mdi/mdiMinus.js"
import { mdiMinusBox } from "@adaptive-ds/mdi/mdiMinusBox.js"
import { mdiPlus } from "@adaptive-ds/mdi/mdiPlus.js"
import { mdiPlusBox } from "@adaptive-ds/mdi/mdiPlusBox.js"
import { omit } from "solid-js"
import { Input } from "#ui/input/input/Input.jsx"
import type { NumberInputText } from "#ui/input/number/NumberInputTexts.jsx"
import { numberInputTextDefault } from "#ui/input/number/NumberInputTexts.jsx"
import { ButtonIconOnly } from "#ui/interactive/button/ButtonIconOnly.jsx"
import { type ButtonVariant, buttonVariant } from "#ui/interactive/button/buttonCva.js"
import { cn } from "cn"
import type { SignalObject } from "#ui/utils/createSignalObject.js"
import { safeParseInt } from "#utils/int/safeParseInt.js"
import { type ComponentProps, type JSX } from "@solidjs/web"

export interface NumberInputSProps extends ComponentProps<"input"> {
  valueSignal: SignalObject<number>
  min?: number
  max?: number
  incrDecrAmount?: number
  incrDecrAmountMajor?: number
  disabled?: boolean
  class?: string
  inputClass?: string
  variant?: ButtonVariant
  buttonClass?: string
  onValueChange?: (v: number) => void
  id?: string
  texts?: NumberInputText
}

/** Number input with increment and decrement buttons, signal-bound. */
export function NumberInputS(p: NumberInputSProps) {
  const rest = omit(
    p,
    "valueSignal",
    "onValueChange",
    "min",
    "max",
    "incrDecrAmount",
    "incrDecrAmountMajor",
    "disabled",
    "class",
    "inputClass",
    "variant",
    "buttonClass",
    "id",
    "texts",
  )
  const hasMajor = p.incrDecrAmountMajor !== undefined
  const onChange: JSX.InputEventHandlerUnion<HTMLInputElement, InputEvent> | undefined = (e) => {
    const n = p.valueSignal.get()
    let newN = safeParseInt(e.target.value, n)
    if (p.min !== undefined) newN = Math.max(p.min, newN)
    if (p.max !== undefined) newN = Math.min(p.max, newN)
    p.valueSignal.set(newN)
    if (p.onValueChange) p.onValueChange(newN)
  }
  const decrementMajor: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent> | undefined = (e) => {
    const n = p.valueSignal.get()
    let newN = n - (p.incrDecrAmountMajor ?? 10) * (e.ctrlKey ? 100 : 1)
    if (p.min !== undefined) newN = Math.max(p.min, newN)
    p.valueSignal.set(newN)
    if (p.onValueChange) p.onValueChange(newN)
  }
  const decrement: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent> | undefined = (e) => {
    const n = p.valueSignal.get()
    let newN = n - (p.incrDecrAmount ?? 1) * (e.ctrlKey ? 100 : 1)
    if (p.min !== undefined) newN = Math.max(p.min, newN)
    p.valueSignal.set(newN)
    if (p.onValueChange) p.onValueChange(newN)
  }
  const increment: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent> | undefined = (e) => {
    const n = p.valueSignal.get()
    let newN = n + (p.incrDecrAmount ?? 1) * (e.ctrlKey ? 100 : 1)
    if (p.max !== undefined) newN = Math.min(p.max, newN)
    p.valueSignal.set(newN)
    if (p.onValueChange) p.onValueChange(newN)
  }
  const incrementMajor: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent> | undefined = (e) => {
    const n = p.valueSignal.get()
    let newN = n + (p.incrDecrAmountMajor ?? 10) * (e.ctrlKey ? 100 : 1)
    if (p.max !== undefined) newN = Math.min(p.max, newN)
    p.valueSignal.set(newN)
    if (p.onValueChange) p.onValueChange(newN)
  }
  const defaultVariant = buttonVariant.ghost

  const texts = p.texts ?? numberInputTextDefault

  return (
    <div class={cn("flex flex-row flex-nowrap items-center", p.class)}>
      {p.incrDecrAmountMajor && (
        <ButtonIconOnly
          icon={mdiMinusBox}
          title={texts.decreaseByX(p.incrDecrAmountMajor)}
          onClick={decrementMajor}
          variant={p.variant ?? defaultVariant}
          class={cn("rounded-r-none", p.buttonClass)}
          disabled={p.disabled || (p.min !== undefined && p.valueSignal.get() <= p.min)}
          type={"button"}
        />
      )}
      <ButtonIconOnly
        icon={mdiMinus}
        title={texts.decreaseByX(p.incrDecrAmount ?? 1)}
        onClick={decrement}
        variant={p.variant ?? defaultVariant}
        class={cn(hasMajor ? "rounded-none" : "rounded-r-none", p.buttonClass)}
        disabled={p.disabled || (p.min !== undefined && p.valueSignal.get() <= p.min)}
        type={"button"}
      />
      <Input
        type="number"
        value={p.valueSignal.get()}
        onInput={onChange}
        id={p.id}
        class={cn("w-14 rounded-none text-center outline-0 focus:z-10", p.inputClass)}
        disabled={p.disabled}
        min={p.min}
        max={p.max}
        {...rest}
      />
      <ButtonIconOnly
        icon={mdiPlus}
        title={texts.increaseByX(p.incrDecrAmount ?? 1)}
        onClick={increment}
        variant={p.variant ?? defaultVariant}
        class={cn(hasMajor ? "rounded-none" : "rounded-l-none", p.buttonClass)}
        disabled={p.disabled || (p.max !== undefined && p.valueSignal.get() >= p.max)}
        type={"button"}
      />
      {p.incrDecrAmountMajor && (
        <ButtonIconOnly
          icon={mdiPlusBox}
          title={texts.increaseByX(p.incrDecrAmountMajor)}
          onClick={incrementMajor}
          variant={p.variant ?? defaultVariant}
          class={cn("rounded-l-none", p.buttonClass)}
          disabled={p.disabled || (p.max !== undefined && p.valueSignal.get() >= p.max)}
          type={"button"}
        />
      )}
    </div>
  )
}
