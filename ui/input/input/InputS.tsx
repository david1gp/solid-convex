import { omit } from "solid-js"
import { Input } from "#ui/input/input/Input.jsx"
import type { HasValueSignalString } from "#ui/utils/HasValueSignalString.js"
import { type ComponentProps, type JSX } from "@solidjs/web"

export interface InputSProps extends HasValueSignalString, ComponentProps<"input"> {}

/** Text input bound to a string signal. */
export function InputS(p: InputSProps) {
  const rest = omit(p, "valueSignal", "value", "onInput")
  const onInputLocal: JSX.InputEventHandlerUnion<HTMLInputElement, InputEvent> = (e) => {
    const value = e.currentTarget.value
    p.valueSignal.set(value)
    if (p.onInput && typeof p.onInput === "function") {
      p.onInput(e)
    }
  }
  return <Input value={p.valueSignal.get()} onInput={onInputLocal} {...rest} />
}
