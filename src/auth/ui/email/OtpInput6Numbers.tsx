import { InputS } from "#ui/input/input/InputS.jsx"
import { cn } from "cn"
import type { SignalObject } from "#ui/utils/createSignalObject.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"

interface OtpInput6NumbersProps extends MayHaveClass {
  id: string
  valueSignal: SignalObject<string>
  error?: boolean
}

export function OtpInput6Numbers(p: OtpInput6NumbersProps) {
  const handleInput = (e: InputEvent) => {
    const target = e.currentTarget as HTMLInputElement
    const value = target.value.replace(/\D/g, "").slice(0, 6)
    p.valueSignal.set(value)
  }

  return (
    <InputS
      id={p.id}
      type="text"
      inputmode="numeric"
      placeholder="000000"
      valueSignal={p.valueSignal}
      onInput={handleInput}
      maxlength={6}
      class={cn(
        "w-full text-center text-lg font-mono", // typography
        "border-2 rounded-md focus:outline-none focus:ring-2", // borders
        p.error ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:border-blue-500 focus:ring-blue-200", // state
      )}
      autocomplete="one-time-code"
    />
  )
}
