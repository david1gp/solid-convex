import { useParams } from "@tanstack/solid-router"
import { createEffect, createMemo, onCleanup } from "solid-js"
import { api } from "#convex/_generated/api.js"
import type { Id } from "#convex/_generated/dataModel.js"
import { appIcons } from "#src/app/icon/appIcons.ts"
import { userSessionSignal, userTokenGet } from "#src/auth/ui/signals/userSessionSignal.ts"
import type { HierarchyDeleteTarget } from "#src/hierarchy_delete/model/hierarchyDeleteTargetSchema.ts"
import { teamSchema } from "#src/team/model/teamSchema.ts"
import { teamHrefGet } from "#src/team/ui/teamHrefGet.ts"
import { teamStorageRead } from "#src/team/ui/teamStorageRead.ts"
import { teamStorageWriterCreate } from "#src/team/ui/teamStorageWriterCreate.ts"
import { teamParamsParse } from "#src/team/url/teamParamsParse.ts"
import { queryCreate } from "#src/utils/convex_client/queryCreate.ts"
import { navigateTo } from "#src/utils/router/navigateTo.ts"
import { createSignalObject, type SignalObject } from "#ui/utils/createSignalObject.ts"

function initialTabGet(): string {
  if (typeof window === "undefined") return "details"
  try {
    const tab = new URL(window.location.href).searchParams.get("tab")
    return tab || "details"
  } catch {
    return "details"
  }
}

export function teamDetailPageStateCreate() {
  const rawParams = useParams({ strict: false })
  const parsedParams = createMemo(() => teamParamsParse(rawParams()))
  const paramError = () => {
    const res = parsedParams()
    if (!res.success) return res.errorMessage
    if (!res.data.teamId) return "Team ID is required"
    return ""
  }

  const orgHandle = () => {
    const res = parsedParams()
    return res.success ? res.data.orgHandle : undefined
  }
  const teamId = () => {
    const res = parsedParams()
    return res.success ? res.data.teamId : undefined
  }
  const validTeamId = () => {
    const id = teamId()
    return id ? (id as Id<"teams">) : undefined
  }

  const result = queryCreate(api.team.teamGetQuery, () => {
    if (paramError()) return undefined
    const id = validTeamId()
    if (!id) return undefined
    return {
      token: userTokenGet(),
      teamId: id,
      orgHandle: orgHandle(),
    }
  })

  const orgsResult = queryCreate(api.org.orgListQuery, () => ({
    token: userTokenGet(),
  }))

  const key = () => {
    const id = teamId()
    return id ? `team/detail/${userSessionSignal.get()?.profile.userId ?? ""}/${orgHandle() ?? "global"}/${id}` : ""
  }
  const writer = teamStorageWriterCreate()
  createEffect(() => {
    const k = key()
    if (!k) return
    const value = result()
    if (value?.success) writer.save(k, value.data)
  })

  const team = () => {
    if (paramError()) return undefined
    const value = result()
    if (value) return value.success ? value.data : undefined
    const k = key()
    if (!k) return undefined
    const cached = teamStorageRead(k, teamSchema)
    return cached.success ? cached.data : undefined
  }

  const orgName = () => {
    const currentTeam = team()
    const orgs = orgsResult()
    if (orgs?.success) {
      const match = orgs.data.page.find(
        (o) => (currentTeam && o._id === currentTeam.orgId) || (orgHandle() && o.orgHandle === orgHandle()),
      )
      if (match) return match.name || match.orgHandle
    }
    return orgHandle()
  }

  const deleteDialogOpen = createSignalObject(false)
  const deleteTarget = createMemo<HierarchyDeleteTarget | undefined>(() => {
    const id = validTeamId()
    if (!id) return undefined
    return {
      kind: "team",
      teamId: id,
    }
  })
  const onDeleteSuccess = () => {
    navigateTo(teamHrefGet("list", orgHandle()))
  }

  const tabOptions = (): ["details", "projects"] => ["details", "projects"]

  const initialTab = initialTabGet()
  const selectedTab: SignalObject<string> = createSignalObject(
    tabOptions().includes(initialTab as "details" | "projects") ? initialTab : "details",
  )

  if (typeof window !== "undefined") {
    const handlePopState = () => {
      const rawTab = initialTabGet()
      const options = tabOptions()
      const targetTab = options.includes(rawTab as "details" | "projects") ? rawTab : "details"
      if (selectedTab.get() !== targetTab) {
        selectedTab.set(targetTab)
      }
    }

    window.addEventListener("popstate", handlePopState)
    onCleanup(() => {
      window.removeEventListener("popstate", handlePopState)
    })
  }

  createEffect(() => {
    const options = tabOptions()
    const current = selectedTab.get()
    if (!options.includes(current as "details" | "projects")) {
      selectedTab.set("details")
    }
  })

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
        const targetParam = tab === "details" ? null : tab
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

  createEffect(() => {
    const tab = selectedTab.get()
    syncUrlSearchParam(tab)
  })

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
      case "details":
        return "Details"
      case "projects":
        return "Projects"
      default:
        return tab
    }
  }

  const tabIcon = (tab: string): string => {
    switch (tab) {
      case "details":
        return appIcons.details
      case "projects":
        return appIcons.project
      default:
        return ""
    }
  }

  return {
    team,
    loading: () => !paramError() && !result() && !team(),
    error: () => {
      const pErr = paramError()
      if (pErr) return pErr
      const value = result()
      return value && !value.success ? value.errorMessage : ""
    },
    listHref: () => teamHrefGet("list", orgHandle()),
    editHref: () => (teamId() ? teamHrefGet("edit", orgHandle(), teamId()) : "/org"),
    orgHandle,
    orgName,
    deleteDialogOpen,
    deleteTarget,
    onDeleteSuccess,
    selectedTab,
    tabOptions,
    tabText,
    tabIcon,
  }
}
