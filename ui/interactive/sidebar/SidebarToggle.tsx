import { ButtonIcon } from "#ui/interactive/button/ButtonIcon.jsx"
import type { SidebarState } from "#ui/interactive/sidebar/SidebarState.jsx"
import { sidebarToggleStateCreate } from "#ui/interactive/sidebar/sidebarToggleStateCreate.js"
import { Icon } from "#ui/static/icon/Icon.jsx"
import type { MayHaveButtonVariant } from "#ui/utils/MayHaveButtonVariant.js"
import type { MayHaveChildren } from "#ui/utils/MayHaveChildren.js"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.js"

export interface SidebarToggleProps
  extends SidebarState,
    SidebarToggleClasses,
    MayHaveChildren,
    MayHaveClass,
    MayHaveButtonVariant {
  iconClass?: string
}

interface SidebarToggleClasses {
  iconDesktopOpen?: string
  iconDesktopClose?: string
  iconMobileOpen?: string
  iconMobileClose?: string
}

/** Button toggling sidebar open state, with hotkey. */
export function SidebarToggle(p: SidebarToggleProps) {
  const state = sidebarToggleStateCreate({
    state: () => p,
    iconDesktopOpen: () => p.iconDesktopOpen,
    iconDesktopClose: () => p.iconDesktopClose,
    iconMobileOpen: () => p.iconMobileOpen,
    iconMobileClose: () => p.iconMobileClose,
  })

  return (
    <ButtonIcon variant={p.variant} onClick={state.handleToggle} title={state.toggleTitle()} class={p.class}>
      {p.children ? p.children : <Icon path={state.toggleIcon()} class={p.iconClass} />}
    </ButtonIcon>
  )
}
