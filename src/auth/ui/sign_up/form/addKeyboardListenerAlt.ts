import { onSettled } from "solid-js"

export function addKeyboardListenerAlt(key: string, fn: () => void) {
  onSettled(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === key) {
        e.preventDefault()
        fn()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  })
}
