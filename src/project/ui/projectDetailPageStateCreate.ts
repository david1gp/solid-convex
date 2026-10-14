import { useParams } from "@tanstack/solid-router"
import { createEffect, createMemo } from "solid-js"
import { api } from "#convex/_generated/api.js"
import type { Id } from "#convex/_generated/dataModel.js"
import { userSessionSignal, userTokenGet } from "#src/auth/ui/signals/userSessionSignal.ts"
import { projectSchema } from "#src/project/model/projectSchema.ts"
import { projectHrefGet } from "#src/project/ui/projectHrefGet.ts"
import { projectStorageRead } from "#src/project/ui/projectStorageRead.ts"
import { projectStorageWriterCreate } from "#src/project/ui/projectStorageWriterCreate.ts"
import { projectParamsParse } from "#src/project/url/projectParamsParse.ts"
import { teamHrefGet } from "#src/team/ui/teamHrefGet.ts"
import { queryCreate } from "#src/utils/convex_client/queryCreate.ts"
import { navigateTo } from "#src/utils/router/navigateTo.ts"
import { createSignalObject } from "#ui/utils/createSignalObject.ts"
import type { HierarchyDeleteTarget } from "#src/hierarchy_delete/model/hierarchyDeleteTargetSchema.ts"

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
  }
}
