import { type JSXElement, Show, splitProps } from "solid-js"
import type { CorcuDialogTexts } from "#ui/interactive/dialog/CorcuDialogTexts.js"
import { SidebarMobileDrawer } from "#ui/interactive/sidebar/SidebarMobileDrawer.jsx"
import type { SidebarState } from "#ui/interactive/sidebar/SidebarState.jsx"
import { sidebarStateCreate } from "#ui/interactive/sidebar/sidebarStateCreate.js"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.js"

export interface SidebarProps extends MayHaveClass {
  state: SidebarState
  defaultWidth?: number
  debounceMs?: number

  //
  // props for mobile dialog
  //
  title: string
  description?: string
  titleClass?: string
  descriptionClass?: string
  texts?: CorcuDialogTexts
  desktopChildren: JSXElement
  mobileChildren: JSXElement
}

/** Responsive sidebar switching between desktop and mobile drawer. */
export function Sidebar(p: SidebarProps) {
  const [s, rest] = splitProps(p, ["state", "defaultWidth", "debounceMs", "class", "desktopChildren", "mobileChildren"])
  const state = sidebarStateCreate({
    state: () => s.state,
    defaultWidth: () => s.defaultWidth,
    debounceMs: () => s.debounceMs,
  })

  return (
    <>
      <Show when={!state.isMobile() && state.desktopOpen()}>{s.desktopChildren}</Show>
      <Show when={state.isMobile()}>
        <SidebarMobileDrawer {...rest} open={state.mobileSignal}>
          {s.mobileChildren}
        </SidebarMobileDrawer>
      </Show>
    </>
  )
}
