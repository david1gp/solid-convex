import { mdiChevronLeft } from "@adaptive-ds/mdi/mdiChevronLeft.js"
import { mdiChevronRight } from "@adaptive-ds/mdi/mdiChevronRight.js"
import { mdiMenu } from "@adaptive-ds/mdi/mdiMenu.js"
import { onSettled } from "solid-js"
import { ttt } from "#ui/i18n/ttt.js"
import type { SidebarState } from "#ui/interactive/sidebar/SidebarState.jsx"

export function sidebarToggleStateCreate(p: {
  state: () => SidebarState
  iconDesktopOpen: () => string | undefined
  iconDesktopClose: () => string | undefined
  iconMobileOpen: () => string | undefined
  iconMobileClose: () => string | undefined
}) {
  const isOpen = () => (p.state().isMobile.get() ? p.state().openMobile.get() : p.state().openDesktop.get())

  function handleToggle() {
    if (p.state().isMobile.get()) {
      p.state().openMobile.set(!p.state().openMobile.get())
    } else {
      p.state().openDesktop.set(!p.state().openDesktop.get())
    }
  }

  function handleGlobalKeyDown(e: KeyboardEvent) {
    if (e.key === "b" && e.altKey) {
      e.preventDefault()
      handleToggle()
    }
  }

  onSettled(() => {
    window.addEventListener("keydown", handleGlobalKeyDown)
    return () => window.removeEventListener("keydown", handleGlobalKeyDown)
  })

  function toggleIcon(): string {
    if (p.state().isMobile.get()) {
      if (p.state().openMobile.get()) {
        return p.iconMobileOpen() ?? mdiMenu
      }
      return p.iconMobileClose() ?? mdiMenu
    }
    if (p.state().openDesktop.get()) {
      return p.iconDesktopOpen() ?? mdiChevronLeft
    }
    return p.iconDesktopClose() ?? mdiChevronRight
  }

  function toggleTitle(): string {
    return isOpen() ? ttt("Close sidebar") : ttt("Open sidebar")
  }

  return { isOpen, handleToggle, toggleIcon, toggleTitle }
}
