import { debounce } from "@solid-primitives/scheduled"
import { onMount } from "solid-js"
import type { SidebarState } from "#ui/interactive/sidebar/SidebarState.jsx"

export function sidebarStateCreate(p: {
  state: () => SidebarState
  defaultWidth: () => number | undefined
  debounceMs: () => number | undefined
}) {
  onMount(() => {
    const checkMobile = debounce(
      () => p.state().isMobile.set(window.innerWidth < (p.defaultWidth() ?? 768)),
      p.debounceMs() ?? 100,
    )
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
