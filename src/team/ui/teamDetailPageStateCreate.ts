import { useParams } from "@tanstack/solid-router"
import { createEffect, createMemo } from "solid-js"
import { api } from "#convex/_generated/api.js"
import type { Id } from "#convex/_generated/dataModel.js"
import { userSessionSignal, userTokenGet } from "#src/auth/ui/signals/userSessionSignal.ts"
import { teamSchema } from "#src/team/model/teamSchema.ts"
import { teamHrefGet } from "#src/team/ui/teamHrefGet.ts"
import { teamStorageRead } from "#src/team/ui/teamStorageRead.ts"
import { teamStorageWriterCreate } from "#src/team/ui/teamStorageWriterCreate.ts"
import { teamParamsParse } from "#src/team/url/teamParamsParse.ts"
import { queryCreate } from "#src/utils/convex_client/queryCreate.ts"
import { navigateTo } from "#src/utils/router/navigateTo.ts"
import { createSignalObject } from "#ui/utils/createSignalObject.ts"
import type { HierarchyDeleteTarget } from "#src/hierarchy_delete/model/hierarchyDeleteTargetSchema.ts"

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
  }
}
