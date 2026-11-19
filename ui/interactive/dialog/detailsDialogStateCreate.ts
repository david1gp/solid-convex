import { createSignal, onSettled } from "solid-js"

export function detailsDialogStateCreate() {
  const [enhanced, setEnhanced] = createSignal(false)
  onSettled(() => { setEnhanced(true) })

  return { enhanced }
}
