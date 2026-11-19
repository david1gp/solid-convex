import { onCleanup, onSettled as onMount } from "solid-js"
import { isServer } from "@solidjs/web"
import { createSignalObject } from "#ui/utils/createSignalObject.ts"

export const appSidebarCollapsedStorageKey = "solid-convex:sidebar-collapsed"

/** Desktop sidebar rail state (expanded ↔ icon rail); SSR-safe default expanded. */
export const appSidebarCollapsedSignal = createSignalObject(false)

function appSidebarCollapsedStorageLoad(): boolean {
  try {
    return window.localStorage.getItem(appSidebarCollapsedStorageKey) === "1"
  } catch {
    return false
  }
}

/** Load the persisted rail state on mount and follow cross-tab updates. */
export function appSidebarCollapsedInit() {
  if (isServer) return
  onMount(() => {
    appSidebarCollapsedSignal.set(appSidebarCollapsedStorageLoad())
    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== appSidebarCollapsedStorageKey) return
      appSidebarCollapsedSignal.set(appSidebarCollapsedStorageLoad())
    }
    window.addEventListener("storage", onStorage)
    onCleanup(() => window.removeEventListener("storage", onStorage))
  })
}

/** Flip the rail state and persist it like other UI prefs. */
export function appSidebarCollapsedToggle() {
  appSidebarCollapsedSet(!appSidebarCollapsedSignal.get())
}

/** Set the rail state and persist it like other UI prefs. */
export function appSidebarCollapsedSet(collapsed: boolean) {
  appSidebarCollapsedSignal.set(collapsed)
  if (isServer) return
  try {
    window.localStorage.setItem(appSidebarCollapsedStorageKey, collapsed ? "1" : "0")
  } catch {
    // Private mode etc.: keep the in-memory state.
  }
}
