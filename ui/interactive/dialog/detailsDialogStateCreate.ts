import { createSignal, onMount } from "solid-js"

export function detailsDialogStateCreate() {
  const [enhanced, setEnhanced] = createSignal(false)
  onMount(() => setEnhanced(true))

  return { enhanced }
}
