import type { SelectSingleTexts } from "#ui/input/select/SelectSingleTexts.js"
import { selectSingleTextDefault } from "#ui/input/select/SelectSingleTexts.js"
import { createSignalObject } from "#ui/utils/createSignalObject.js"

export function selectSingleStateCreate(p: {
  open: () => boolean | undefined
  onOpenChange: () => ((nextOpen: boolean) => void) | undefined
  texts: () => SelectSingleTexts | undefined
  value: () => string
  valueText: () => ((value: string) => string) | undefined
}) {
  const texts = () => p.texts() ?? selectSingleTextDefault
  const open = createSignalObject(p.open() ?? false)

  function handleOpenChange(nextOpen: boolean): void {
    open.set(nextOpen)
    p.onOpenChange()?.(nextOpen)
  }

  function displayValue(value: string): string {
    const valueText = p.valueText()
    if (!valueText) return value
    return valueText(value) || value
  }

  function triggerLabel(): string {
    const value = p.value()
    if (!value) return texts().selectEntry
    return displayValue(value)
  }

  return { texts, open, handleOpenChange, triggerLabel }
}
