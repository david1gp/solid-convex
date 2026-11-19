import { useLocation } from "@tanstack/solid-router"
import { createEffect } from "solid-js"
import { autoLoginIfUserRoleOnly, userSessionSignal } from "#src/auth/ui/signals/userSessionSignal.ts"
import { userSessionsSignal } from "#src/auth/ui/signals/userSessionsSignal.ts"
import { createSidebarState } from "#ui/interactive/sidebar/createSidebarState.jsx"
import { appShellNavigation } from "./appShellNavigation.ts"

export function appShellStateCreate() {
  const sidebarState = createSidebarState()
  const location = useLocation()
  const navigation = appShellNavigation

  createEffect(
    () => location().pathname,
    () => sidebarState.openMobile.set(false),
    { defer: true },
  )

  const activeNavigationItem = () => {
    const nav = navigation()
    const pathname = location().pathname
    return nav.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)) ?? nav[0]!
  }

  function logout() {
    userSessionSignal.set(null)
    if (autoLoginIfUserRoleOnly()) {
      userSessionsSignal.set([])
    }
  }

  return {
    activeNavigationHref: () => activeNavigationItem().href,
    logout,
    navigation,
    profileClose: () => sidebarState.openMobile.set(false),
    sidebarState,
    user: () => userSessionSignal.get() ?? undefined,
  }
}

export type AppShellState = ReturnType<typeof appShellStateCreate>
