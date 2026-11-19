import { createEffect, onCleanup } from "solid-js"
import * as v from "valibot"
import { ttc } from "#src/app/i18n/ttc.ts"
import { appIcons } from "#src/app/icon/appIcons.ts"
import type { OrgViewContentProps } from "#src/org/org_ui/view/OrgViewContentProps.ts"
import { createSignalObject, type SignalObject } from "#ui/utils/createSignalObject.ts"

const orgTabSchema = v.picklist(["overview", "teams", "members", "invitations"])

function initialTabGet(): string {
  if (typeof window === "undefined") return "overview"
  try {
    const tab = new URL(window.location.href).searchParams.get("tab")
    const parsed = v.safeParse(orgTabSchema, tab)
    return parsed.success ? parsed.output : "overview"
  } catch {
    return "overview"
  }
}

export function orgViewContentStateCreate(props: () => OrgViewContentProps) {
  const tabOptions = (): string[] => {
    if (props().demo) {
      return ["overview", "members", "invitations"]
    }
    return ["overview", "teams", "members", "invitations"]
  }

  const initialTab = initialTabGet()
  const selectedTab: SignalObject<string> = createSignalObject(
    tabOptions().includes(initialTab) ? initialTab : "overview",
  )

  if (typeof window !== "undefined") {
    const handlePopState = () => {
      const rawTab = initialTabGet()
      const options = tabOptions()
      const targetTab = options.includes(rawTab) ? rawTab : "overview"
      if (selectedTab.get() !== targetTab) {
        selectedTab.set(targetTab)
      }
    }

    window.addEventListener("popstate", handlePopState)
    onCleanup(() => {
      window.removeEventListener("popstate", handlePopState)
    })
  }

  createEffect(
    () => ({ options: tabOptions(), current: selectedTab.get() }),
    ({ options, current }) => {
      if (!options.includes(current)) {
        selectedTab.set("overview")
      }
    },
  )

  let idleHandle: number | ReturnType<typeof setTimeout> | undefined

  const syncUrlSearchParam = (tab: string) => {
    if (typeof window === "undefined") return
    if (idleHandle !== undefined) {
      if (typeof window.cancelIdleCallback === "function" && typeof idleHandle === "number") {
        window.cancelIdleCallback(idleHandle)
      } else {
        clearTimeout(idleHandle)
      }
    }

    const schedule =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback
        : (cb: () => void) => setTimeout(cb, 100)

    idleHandle = schedule(() => {
      try {
        const url = new URL(window.location.href)
        const currentParam = url.searchParams.get("tab")
        const targetParam = tab === "overview" ? null : tab
        if (currentParam === targetParam) return

        if (targetParam === null) {
          url.searchParams.delete("tab")
        } else {
          url.searchParams.set("tab", targetParam)
        }
        window.history.replaceState(null, "", url.toString())
      } catch (err) {
        console.warn("Failed to sync tab to URL", err)
      }
    })
  }

  createEffect(
    () => selectedTab.get(),
    (tab) => {
      syncUrlSearchParam(tab)
    },
  )

  onCleanup(() => {
    if (idleHandle !== undefined && typeof window !== "undefined") {
      if (typeof window.cancelIdleCallback === "function" && typeof idleHandle === "number") {
        window.cancelIdleCallback(idleHandle)
      } else {
        clearTimeout(idleHandle)
      }
    }
  })

  const tabText = (tab: string): string => {
    switch (tab) {
      case "overview":
        return ttc("Overview")
      case "teams":
        return ttc("Teams")
      case "members":
        return ttc("Members")
      case "invitations":
        return ttc("Invitations")
      default:
        return tab
    }
  }

  const tabIcon = (tab: string): string | undefined => {
    switch (tab) {
      case "overview":
        return appIcons.details
      case "teams":
        return appIcons.team
      case "members":
        return appIcons.member
      case "invitations":
        return appIcons.invitation
      default:
        return undefined
    }
  }

  const tabAmount = (tab: string): number | undefined => {
    switch (tab) {
      case "members":
        return props().members?.length
      case "invitations":
        return props().invitations?.length
      default:
        return undefined
    }
  }

  return {
    selectedTab,
    tabOptions,
    tabText,
    tabIcon,
    tabAmount,
  }
}
