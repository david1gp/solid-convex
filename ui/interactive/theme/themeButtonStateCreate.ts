import { createSignal, onCleanup, onMount } from "solid-js"
import type { ThemeButtonText } from "#ui/interactive/theme/ThemeButtonText.js"
import { themeButtonTextDefault } from "#ui/interactive/theme/ThemeButtonText.js"
import { themeInit, themeRotate, themeSignal } from "#ui/interactive/theme/themeSignal.js"
import { themeIcon } from "#ui/interactive/theme/themeVariant.js"

export function themeButtonStateCreate(p: { texts: () => ThemeButtonText | undefined }) {
  const navigate = (_to: string) => {}
  const handleGlobalKeyDown = createGlobalKeyHandler(navigate)

  const texts = () => p.texts() ?? themeButtonTextDefault
  // SSR always starts as `os` ("Operation system"). Showing that label then
  // swapping to Light/Dark after themeInit shifts the navbar. Wait until the
  // stored theme is applied before rendering the label.
  const [themeReady, setThemeReady] = createSignal(false)

  onMount(() => {
    themeInit()
    setThemeReady(true)
    window.addEventListener("keydown", handleGlobalKeyDown)
    onCleanup(() => window.removeEventListener("keydown", handleGlobalKeyDown))
  })

  return {
    themeReady,
    title: () => texts().currentTheme(texts()[themeSignal.get()]),
    icon: () => themeIcon(themeSignal.get()),
    label: () => texts()[themeSignal.get()],
    rotate: themeRotate,
  }
}

function createGlobalKeyHandler(navigate: (to: string) => void) {
  return (e: KeyboardEvent) => {
    if (e.key === "s" && e.altKey) {
      e.preventDefault()
      themeRotate()
    } else if (e.key === "d" && e.altKey) {
      e.preventDefault()
      navigate("/demos")
    }
  }
}
