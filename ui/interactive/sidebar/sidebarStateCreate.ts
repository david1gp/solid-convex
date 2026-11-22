import { debounce } from "@solid-primitives/scheduled"
import { onSettled } from "solid-js"
import type { SidebarState } from "#ui/interactive/sidebar/SidebarState.jsx"

export function sidebarStateCreate(p: {
  state: () => SidebarState
  defaultWidth: () => number | undefined
  debounceMs: () => number | undefined
}) {
  // Evaluate the same min-width media query as the Tailwind responsive classes, so JS
  // mobile state and CSS always agree. window.innerWidth includes classic scrollbar
  // width while media queries exclude it; that mismatch hid both sidebar and drawer.
  const checkMobile = debounce(
    () => p.state().isMobile.set(!window.matchMedia(`(min-width: ${p.defaultWidth() ?? 768}px)`).matches),
    p.debounceMs() ?? 100,
  )
  onSettled(() => {
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  })

  return {
    isMobile: () => p.state().isMobile.get(),
    desktopOpen: () => p.state().openDesktop.get(),
    mobileSignal: p.state().openMobile,
  }
}
