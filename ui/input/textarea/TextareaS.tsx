import { omit } from "solid-js"
import { Textarea } from "#ui/input/textarea/Textarea.jsx"
import type { SignalObject } from "#ui/utils/createSignalObject.js"
import { type ComponentProps, type JSX } from "@solidjs/web"

export interface TextAreaSProps extends ComponentProps<"textarea"> {
  valueSignal: SignalObject<string>
}

/** Textarea bound to a string signal. */
export function TextareaS(p: TextAreaSProps) {
  const rest = omit(p, "valueSignal", "value", "onInput")
  const onInputLocal: JSX.InputEventHandlerUnion<HTMLTextAreaElement, InputEvent> = (e) => {
    const value = e.currentTarget.value
    p.valueSignal.set(value)
    if (p.onInput && typeof p.onInput === "function") {
      p.onInput(e)
    }
  }
  return <Textarea value={p.valueSignal.get()} onInput={onInputLocal} {...rest} />
}
