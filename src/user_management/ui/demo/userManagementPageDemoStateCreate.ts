import { useNavigate, useParams } from "@tanstack/solid-router"
import { createEffect, createMemo } from "solid-js"
import type { UserRole } from "#src/auth/model_field/userRole.ts"
import { pageDemoHref } from "#src/app/demos/pageDemoHref.ts"
import { teamPageDemoFixturesGet } from "#src/team/ui/demo/teamPageDemoFixturesGet.ts"
import { userManagementPageDemoFixturesGet } from "#src/user_management/ui/demo/userManagementPageDemoFixturesGet.ts"
import { userManagementMembersFilter, userRoleFilterOptionsGet } from "#src/user_management/ui/userAvailableRoles.ts"
import { userManagementRolesDialogStateCreate } from "#src/user_management/ui/userManagementRolesDialogStateCreate.ts"
import { userTeamOptionsAccumulate } from "#src/user_management/ui/userTeamOptionsAccumulate.ts"
import type { userManagementPageStateCreate } from "#src/user_management/ui/userManagementPageStateCreate.ts"
import { createSignalObject } from "#ui/utils/createSignalObject.ts"

type UserManagementPageState = ReturnType<typeof userManagementPageStateCreate>

function paginationStub(): UserManagementPageState["pagination"] {
  return {
    page: () => undefined,
    result: () => undefined,
    canNext: () => false,
    canPrevious: () => false,
    next: () => {},
    previous: () => {},
    loading: () => false,
    cursor: () => null,
    history: () => [],
    reset: () => {},
  }
}

/** Local-only user-management state: fixture users, no Convex and no Zitadel.
 * Role/team saves update the in-memory fixtures and report a local status. */
export function userManagementPageDemoStateCreate(): UserManagementPageState {
  const navigate = useNavigate()
  const params = useParams({ strict: false })
  const fixtures = userManagementPageDemoFixturesGet()
  const teamFixtures = teamPageDemoFixturesGet()

  const selectedUserId = () => params().userId as string | undefined
  const users = () => fixtures.users()

  const roleFilter = createSignalObject("all")
  const roleFilterOptions = createMemo(() => userRoleFilterOptionsGet(users()))
  const visibleUsers = createMemo(() => userManagementMembersFilter(users(), roleFilter.get()))

  const rolesDialog = userManagementRolesDialogStateCreate({
    setRoles: async ({ roles, userId }) => {
      const updated = fixtures.setRoles(userId, roles)
      return updated
        ? { success: true, errorMessage: "" }
        : { success: false, errorMessage: "User not found in demo fixtures." }
    },
    members: users,
  })

  const selectedUser = createMemo(() => {
    const id = selectedUserId()
    if (!id) return undefined
    return users().find((user) => user.userId === id)
  })

  const rolesSignal = createSignalObject<UserRole[]>([])
  const teamIdsSignal = createSignalObject<string[]>([])
  const isSavingSignal = createSignalObject(false)
  const saveStatusSignal = createSignalObject("")
  const saveErrorSignal = createSignalObject("")
  const isSyncingSignal = createSignalObject(false)
  const syncStatusSignal = createSignalObject("")
  const syncErrorSignal = createSignalObject("")

  let lastSyncedUserId: string | null = null
  createEffect(() => {
    const currentId = selectedUserId()
    const user = selectedUser()
    if (!currentId) {
      lastSyncedUserId = null
      rolesSignal.set([])
      teamIdsSignal.set([])
      saveStatusSignal.set("")
      saveErrorSignal.set("")
      return
    }
    if (user && lastSyncedUserId !== user.userId) {
      lastSyncedUserId = user.userId
      rolesSignal.set([...(user.roles as UserRole[])])
      teamIdsSignal.set([...user.teamIds])
      saveStatusSignal.set("")
      saveErrorSignal.set("")
    }
  })

  const orgMap = new Map([["org-sample-1", "Sample Organization"]])
  const teamOptions = createMemo(() =>
    userTeamOptionsAccumulate({
      existingOptions: [],
      incomingPage: teamFixtures.teams(),
      orgMap,
      selectedTeamIds: teamIdsSignal.get(),
    }),
  )

  async function saveAssignments() {
    const id = selectedUserId()
    if (!id || isSavingSignal.get()) return
    isSavingSignal.set(true)
    saveStatusSignal.set("")
    saveErrorSignal.set("")
    try {
      const updated = fixtures.assign(id, { roles: [...rolesSignal.get()], teamIds: [...teamIdsSignal.get()] })
      if (!updated) {
        saveErrorSignal.set("User is no longer available in the local demo.")
        return
      }
      saveStatusSignal.set("Assignments saved locally — demo only, Zitadel was not contacted.")
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
  }

  async function syncUsers() {
    if (isSyncingSignal.get()) return
    isSyncingSignal.set(true)
    syncErrorSignal.set("")
    try {
      syncStatusSignal.set("Demo users refreshed locally — demo only, Zitadel was not contacted.")
    } finally {
      isSyncingSignal.set(false)
    }
  }

  return {
    isAdmin: () => true,
    pagination: paginationStub(),
    users,
    roleFilter,
    roleFilterOptions,
    visibleUsers,
    rolesDialog,
    listError: () => "",
    selectedUserId,
    selectedUser,
    rolesSignal,
    teamIdsSignal,
    teamOptions,
    loadMoreTeams: () => {},
    hasMoreTeams: () => false,
    isSaving: () => isSavingSignal.get(),
    saveStatus: () => saveStatusSignal.get(),
    saveError: () => saveErrorSignal.get(),
    partialFailure: () => null,
    saveAssignments,
    resetForm,
    selectUser: (userId: string) => {
      void navigate({ to: pageDemoHref("/user-management/:userId", { userId }) })
    },
    deselectUser: () => {
      void navigate({ to: pageDemoHref("/user-management") })
    },
    isSyncing: () => isSyncingSignal.get(),
    syncStatus: () => syncStatusSignal.get(),
    syncError: () => syncErrorSignal.get(),
    syncUsers,
  }
}
