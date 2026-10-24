import { useParams } from "@tanstack/solid-router"
import { createEffect, createMemo, onCleanup } from "solid-js"
import * as v from "valibot"
import { api } from "#convex/_generated/api.js"
import type { Id } from "#convex/_generated/dataModel.js"
import { appIcons } from "#src/app/icon/appIcons.ts"
import { userSessionSignal, userTokenGet } from "#src/auth/ui/signals/userSessionSignal.ts"
import type { HierarchyDeleteTarget } from "#src/hierarchy_delete/model/hierarchyDeleteTargetSchema.ts"
import { projectSchema } from "#src/project/model/projectSchema.ts"
import { projectHrefGet } from "#src/project/ui/projectHrefGet.ts"
import { projectStorageRead } from "#src/project/ui/projectStorageRead.ts"
import { projectStorageWriterCreate } from "#src/project/ui/projectStorageWriterCreate.ts"
import { projectParamsParse } from "#src/project/url/projectParamsParse.ts"
import { teamHrefGet } from "#src/team/ui/teamHrefGet.ts"
import { queryCreate } from "#src/utils/convex_client/queryCreate.ts"
import { navigateTo } from "#src/utils/router/navigateTo.ts"
import { createSignalObject, type SignalObject } from "#ui/utils/createSignalObject.ts"

const projectTabSchema = v.picklist(["details", "notes"])

function initialTabGet(): string {
  if (typeof window === "undefined") return "details"
  try {
    const tab = new URL(window.location.href).searchParams.get("tab")
    const parsed = v.safeParse(projectTabSchema, tab)
    return parsed.success ? parsed.output : "details"
  } catch {
    return "details"
  }
}

export function projectDetailPageStateCreate() {
  const rawParams = useParams({ strict: false })
  const parsedParams = createMemo(() => projectParamsParse(rawParams()))
  const paramError = () => {
    const res = parsedParams()
    if (!res.success) return res.errorMessage
    if (!res.data.projectId) return "Project ID is required"
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
  const projectId = () => {
    const res = parsedParams()
    return res.success ? res.data.projectId : undefined
  }
  const validProjectId = () => {
    const id = projectId()
    return id ? (id as Id<"projects">) : undefined
  }
  const validTeamId = () => {
    const id = teamId()
    return id ? (id as Id<"teams">) : undefined
  }

  const result = queryCreate(api.project.projectGetQuery, () => {
    if (paramError()) return undefined
    const id = validProjectId()
    if (!id) return undefined
    return {
      token: userTokenGet(),
      projectId: id,
      teamId: validTeamId(),
      orgHandle: orgHandle(),
    }
  })

  const key = () => {
    const id = projectId()
    return id
      ? `project/detail/${userSessionSignal.get()?.profile.userId ?? ""}/${orgHandle() ?? "global"}/${teamId() ?? "noteam"}/${id}`
      : ""
  }
  const writer = projectStorageWriterCreate()
  createEffect(() => {
    const k = key()
    if (!k) return
    const value = result()
    if (value?.success) writer.save(k, value.data)
  })

  const project = () => {
    if (paramError()) return undefined
    const value = result()
    if (value) return value.success ? value.data : undefined
    const k = key()
    if (!k) return undefined
    const cached = projectStorageRead(k, projectSchema)
    return cached.success ? cached.data : undefined
  }

  const ancestorTeamId = () => validTeamId() ?? (project()?.teamId as Id<"teams"> | undefined)
  const teamResult = queryCreate(api.team.teamGetQuery, () => {
    const id = ancestorTeamId()
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

  const teamName = () => {
    const res = teamResult()
    if (res?.success) return res.data.name
    return undefined
  }

  const orgName = () => {
    const currentProject = project()
    const teamRes = teamResult()
    const teamOrgId = teamRes?.success ? teamRes.data.orgId : undefined
    const currentOrgId = currentProject?.orgId ?? teamOrgId
    const orgs = orgsResult()
    if (orgs?.success) {
      const match = orgs.data.page.find(
        (o) => (currentOrgId && o._id === currentOrgId) || (orgHandle() && o.orgHandle === orgHandle()),
      )
      if (match) return match.name || match.orgHandle
    }
    return orgHandle()
  }

  const deleteDialogOpen = createSignalObject(false)
  const deleteTarget = createMemo<HierarchyDeleteTarget | undefined>(() => {
    const id = validProjectId()
    if (!id) return undefined
    return {
      kind: "project",
      projectId: id,
    }
  })
  const onDeleteSuccess = () => {
    navigateTo(projectHrefGet("list", { orgHandle: orgHandle(), teamId: teamId() }))
  }

  const tabOptions = (): ["details", "notes"] => ["details", "notes"]

  const initialTab = initialTabGet()
  const selectedTab: SignalObject<string> = createSignalObject(
    tabOptions().includes(initialTab as "details" | "notes") ? initialTab : "details",
  )

  if (typeof window !== "undefined") {
    const handlePopState = () => {
      const rawTab = initialTabGet()
      const options = tabOptions()
      const targetTab = options.includes(rawTab as "details" | "notes") ? rawTab : "details"
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
    if (!options.includes(current as "details" | "notes")) {
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
      case "notes":
        return "Notes"
      default:
        return tab
    }
  }

  const tabIcon = (tab: string): string => {
    switch (tab) {
      case "details":
        return appIcons.details
      case "notes":
        return appIcons.note
      default:
        return ""
    }
  }

  return {
    project,
    loading: () => !paramError() && !result() && !project(),
    error: () => {
      const pErr = paramError()
      if (pErr) return pErr
      const value = result()
      return value && !value.success ? value.errorMessage : ""
    },
    listHref: () => projectHrefGet("list", { orgHandle: orgHandle(), teamId: teamId() }),
    editHref: () => {
      const pid = projectId()
      return pid
        ? projectHrefGet("edit", {
            orgHandle: orgHandle(),
            teamId: teamId(),
            projectId: pid,
          })
        : "/project"
    },
    teamHref: () => {
      const currentTeamId = teamId() ?? project()?.teamId
      return currentTeamId ? teamHrefGet("detail", orgHandle(), currentTeamId) : undefined
    },
    orgHandle,
    teamId,
    projectId,
    teamName,
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
