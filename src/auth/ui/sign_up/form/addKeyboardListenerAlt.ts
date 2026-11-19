import { onCleanup, onSettled as onMount } from "solid-js"

export function addKeyboardListenerAlt(key: string, fn: () => void) {
  onMount(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === key) {
        e.preventDefault()
        fn()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    onCleanup(() => {
      document.removeEventListener("keydown", handleKeyDown)
    })
  })
}
