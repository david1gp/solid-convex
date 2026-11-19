import { useNavigate, useParams } from "@tanstack/solid-router"
import { createEffect, createMemo, onCleanup, onSettled } from "solid-js"
import * as v from "valibot"
import { api } from "#convex/_generated/api.js"
import type { UserRole } from "#src/auth/model_field/userRole.ts"
import { userRoleIsAdmin } from "#src/auth/model_field/userRole.ts"
import { userSessionSignal, userTokenGet } from "#src/auth/ui/signals/userSessionSignal.ts"
import { type UserProjection, userProjectionSchema } from "#src/user_management/model/userProjectionSchema.ts"
import type { ZitadelUserAssignmentPartialFailure } from "#src/user_management/server/ZitadelUserAssignmentPartialFailure.ts"
import { userManagementMembersFilter, userRoleFilterOptionsGet } from "#src/user_management/ui/userAvailableRoles.ts"
import { userManagementRolesDialogStateCreate } from "#src/user_management/ui/userManagementRolesDialogStateCreate.ts"
import type { UserTeamOption } from "#src/user_management/ui/userTeamOptionSchema.ts"
import { userTeamOptionsAccumulate } from "#src/user_management/ui/userTeamOptionsAccumulate.ts"
import { urlUserManagement } from "#src/user_management/url/urlUserManagement.ts"
import { userManagementParamsParse } from "#src/user_management/url/userManagementParamsParse.ts"
import { createAction } from "#src/utils/convex_client/createAction.ts"
import { cursorPaginationCreate } from "#src/utils/convex_client/cursorPaginationCreate.ts"
import { queryCreate } from "#src/utils/convex_client/queryCreate.ts"
import { createSignalObject } from "#ui/utils/createSignalObject.ts"

export function userManagementPageStateCreate() {
  const navigate = useNavigate()
  const rawParams = useParams({ strict: false })
  const parsedParams = createMemo(() => {
    const res = userManagementParamsParse(rawParams())
    return res.success ? res.data : {}
  })
  const selectedUserId = () => parsedParams().userId

  const session = () => userSessionSignal.get()
  const isAdmin = () => {
    const s = session()
    if (!s) return false
    const role = s.profile.role
    const roles = s.profile.roles ?? []
    return userRoleIsAdmin(role) || roles.includes("admin")
  }

  const pagination = cursorPaginationCreate({
    query: api.userManagement.userProjectionListQuery,
    queryKey: "userProjectionListQuery",
    args: () => ({
      token: userTokenGet(),
    }),
    identity: () => session()?.profile.userId ?? null,
    itemSchema: userProjectionSchema,
    pageSize: 20,
  })

  const users = () => {
    const pageResult = pagination.page()
    return pageResult?.success ? pageResult.data.page : []
  }

  const roleFilterKey = "role"
  const roleFilterValueSchema = v.pipe(v.string(), v.maxLength(100, "Only a max length of 100 is allowed"))
  const roleFilterInitialGet = (): string => {
    if (typeof window === "undefined") return "all"
    try {
      const raw = new URL(window.location.href).searchParams.get(roleFilterKey)
      if (raw === null || raw === "") return "all"
      const parsed = v.safeParse(roleFilterValueSchema, raw)
      return parsed.success && parsed.output !== "" ? parsed.output : "all"
    } catch {
      return "all"
    }
  }
  const roleFilter = createSignalObject<string>(roleFilterInitialGet())
  const roleFilterOptions = createMemo(() => userRoleFilterOptionsGet(users()))
  const visibleUsers = createMemo(() => userManagementMembersFilter(users(), roleFilter.get()))

  let roleFilterIdleHandle: number | ReturnType<typeof setTimeout> | undefined
  const roleFilterSyncUrl = (filter: string) => {
    if (typeof window === "undefined") return
    if (roleFilterIdleHandle !== undefined) {
      if (typeof window.cancelIdleCallback === "function" && typeof roleFilterIdleHandle === "number") {
        window.cancelIdleCallback(roleFilterIdleHandle)
      } else {
        clearTimeout(roleFilterIdleHandle as ReturnType<typeof setTimeout>)
      }
    }
    const schedule =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback
        : (callback: () => void) => setTimeout(callback, 0)
    roleFilterIdleHandle = schedule(() => {
      try {
        const url = new URL(window.location.href)
        if (!filter || filter === "all") {
          url.searchParams.delete(roleFilterKey)
        } else {
          url.searchParams.set(roleFilterKey, filter)
        }
        window.history.replaceState(null, "", url.toString())
      } catch (error) {
        console.warn("Failed to sync role filter to URL", error)
      }
    })
  }

  const roleFilterSet = roleFilter.set
  roleFilter.set = (value) => {
    const result = roleFilterSet(value)
    roleFilterSyncUrl(value)
    return result
  }

  if (typeof window !== "undefined") {
    const handleRoleFilterPopState = () => {
      const next = roleFilterInitialGet()
      if (roleFilter.get() !== next) roleFilterSet(next)
    }
    window.addEventListener("popstate", handleRoleFilterPopState)
    onCleanup(() => {
      window.removeEventListener("popstate", handleRoleFilterPopState)
    })
  }

  onCleanup(() => {
    if (roleFilterIdleHandle !== undefined && typeof window !== "undefined") {
      if (typeof window.cancelIdleCallback === "function" && typeof roleFilterIdleHandle === "number") {
        window.cancelIdleCallback(roleFilterIdleHandle)
      } else {
        clearTimeout(roleFilterIdleHandle as ReturnType<typeof setTimeout>)
      }
    }
  })

  const rolesSaveAction = createAction(api.userManagementActions.userManagementSaveAction)
  const rolesDialog = userManagementRolesDialogStateCreate({
    setRoles: async ({ roles, userId }) => {
      const res = await rolesSaveAction({ token: userTokenGet(), userId, roles: [...roles] })
      if (res.success) return { success: true, errorMessage: "" }
      return { success: false, errorMessage: res.errorMessage }
    },
    members: users,
  })

  const listError = () => {
    const pageResult = pagination.page()
    if (pageResult && !pageResult.success) {
      return pageResult.errorMessage
    }
    return ""
  }

  const singleUserQuery = queryCreate(api.userManagement.userProjectionGetQuery, () => {
    const id = selectedUserId()
    if (!isAdmin() || !id) return undefined
    return {
      token: userTokenGet(),
      userId: id,
    }
  })

  const selectedUser = createMemo((): UserProjection | undefined => {
    const id = selectedUserId()
    if (!id) return undefined
    const match = users().find((u) => u.userId === id)
    if (match) return match
    const single = singleUserQuery()
    if (single?.success) return single.data
    return undefined
  })

  const rolesSignal = createSignalObject<UserRole[]>([])
  const teamIdsSignal = createSignalObject<string[]>([])
  const isSavingSignal = createSignalObject(false)
  const saveStatusSignal = createSignalObject("")
  const saveErrorSignal = createSignalObject("")
  const partialFailureSignal = createSignalObject<ZitadelUserAssignmentPartialFailure | null>(null)

  let lastSyncedUserId: string | null = null

  createEffect(
    () => ({ currentId: selectedUserId(), user: selectedUser() }),
    ({ currentId, user }) => {
      if (!currentId) {
        lastSyncedUserId = null
        rolesSignal.set([])
        teamIdsSignal.set([])
        saveStatusSignal.set("")
        saveErrorSignal.set("")
        partialFailureSignal.set(null)
        return
      }

      if (user && lastSyncedUserId !== user.userId) {
        lastSyncedUserId = user.userId
        rolesSignal.set([...(user.roles as UserRole[])])
        teamIdsSignal.set([...user.teamIds])
        saveStatusSignal.set("")
        saveErrorSignal.set("")
        partialFailureSignal.set(null)
      }
    },
  )

  const teamCursorSignal = createSignalObject<string | null>(null)
  const accumulatedTeamsSignal = createSignalObject<readonly UserTeamOption[]>([])
  const hasMoreTeamsSignal = createSignalObject(false)

  const teamsResult = queryCreate(api.team.teamListQuery, () => ({
    token: userTokenGet(),
    paginationOpts: { numItems: 100, cursor: teamCursorSignal.get() },
  }))

  const orgsResult = queryCreate(api.org.orgListQuery, () => ({
    token: userTokenGet(),
  }))

  const orgMap = createMemo(() => {
    const oRes = orgsResult()
    const map = new Map<string, string>()
    if (oRes?.success) {
      for (const org of oRes.data.page) {
        map.set(org._id, org.name || org.orgHandle)
      }
    }
    return map
  })

  let nextCursor: string | null = null
  createEffect(
    () => ({ tRes: teamsResult(), orgs: orgMap(), selectedTeamIds: teamIdsSignal.get() }),
    ({ tRes, orgs, selectedTeamIds }) => {
      if (tRes?.success) {
        hasMoreTeamsSignal.set(!tRes.data.isDone)
        nextCursor = tRes.data.continueCursor
        accumulatedTeamsSignal.set(
          userTeamOptionsAccumulate({
            existingOptions: accumulatedTeamsSignal.get(),
            incomingPage: tRes.data.page,
            orgMap: orgs,
            selectedTeamIds,
          }),
        )
      }
    },
  )

  const loadMoreTeams = () => {
    if (hasMoreTeamsSignal.get() && nextCursor) {
      teamCursorSignal.set(nextCursor)
    }
  }

  const teamOptions = createMemo((): readonly UserTeamOption[] => {
    return userTeamOptionsAccumulate({
      existingOptions: accumulatedTeamsSignal.get(),
      incomingPage: [],
      orgMap: orgMap(),
      selectedTeamIds: teamIdsSignal.get(),
    })
  })

  const syncAction = createAction(api.userManagementActions.userManagementSyncAction)
  const isSyncingSignal = createSignalObject(false)
  const syncStatusSignal = createSignalObject("")
  const syncErrorSignal = createSignalObject("")

  async function syncUsers() {
    if (isSyncingSignal.get()) return
    const token = userTokenGet()
    if (!token) return

    isSyncingSignal.set(true)
    syncStatusSignal.set("Syncing users with Zitadel…")
    syncErrorSignal.set("")

    try {
      const res = await syncAction({ token })
      if (res.success) {
        syncStatusSignal.set(`Synced ${res.data.syncedCount} users from Zitadel`)
      } else {
        syncErrorSignal.set(res.errorMessage)
        syncStatusSignal.set("")
      }
    } catch (err) {
      syncErrorSignal.set(err instanceof Error ? err.message : String(err))
      syncStatusSignal.set("")
    } finally {
      isSyncingSignal.set(false)
    }
  }

  onSettled(() => {
    if (isAdmin()) {
      void syncUsers()
    }
  })

  const saveAction = createAction(api.userManagementActions.userManagementSaveAction)

  async function saveAssignments() {
    const id = selectedUserId()
    if (!id || isSavingSignal.get()) return

    isSavingSignal.set(true)
    saveStatusSignal.set("")
    saveErrorSignal.set("")
    partialFailureSignal.set(null)

    try {
      const res = await saveAction({
        token: userTokenGet(),
        userId: id,
        roles: rolesSignal.get(),
        teamIds: teamIdsSignal.get(),
      })

      if (!res.success) {
        let partial: ZitadelUserAssignmentPartialFailure | null = null
        if (res.errorData) {
          try {
            partial = JSON.parse(res.errorData) as ZitadelUserAssignmentPartialFailure
          } catch {
            // ignore
          }
        }
        if (partial && (partial.rolesUpdated || partial.teamIdsUpdated)) {
          partialFailureSignal.set(partial)
        }
        saveErrorSignal.set(res.errorMessage)
        return
      }

      saveStatusSignal.set("Assignments saved successfully.")
    } catch (err) {
      saveErrorSignal.set(err instanceof Error ? err.message : "Save failed")
    } finally {
      isSavingSignal.set(false)
    }
  }

  function resetForm() {
    const user = selectedUser()
    if (!user) return
    rolesSignal.set([...(user.roles as UserRole[])])
    teamIdsSignal.set([...user.teamIds])
    saveStatusSignal.set("")
    saveErrorSignal.set("")
    partialFailureSignal.set(null)
  }

  function selectUser(userId: string) {
    void navigate({ to: urlUserManagement(userId) })
  }

  function deselectUser() {
    void navigate({ to: urlUserManagement() })
  }

  return {
    isAdmin,
    pagination,
    users,
    roleFilter,
    roleFilterOptions,
    visibleUsers,
    rolesDialog,
    listError,
    selectedUserId,
    selectedUser,
    rolesSignal,
    teamIdsSignal,
    teamOptions,
    loadMoreTeams,
    hasMoreTeams: () => hasMoreTeamsSignal.get(),
    isSaving: () => isSavingSignal.get(),
    saveStatus: () => saveStatusSignal.get(),
    saveError: () => saveErrorSignal.get(),
    partialFailure: () => partialFailureSignal.get(),
    saveAssignments,
    resetForm,
    selectUser,
    deselectUser,
    isSyncing: () => isSyncingSignal.get(),
    syncStatus: () => syncStatusSignal.get(),
    syncError: () => syncErrorSignal.get(),
    syncUsers,
  }
}
