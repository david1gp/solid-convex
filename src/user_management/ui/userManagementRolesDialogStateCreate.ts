import type { UserProjection } from "#src/user_management/model/userProjectionSchema.ts"
import { createSignalObject, type SignalObject } from "#ui/utils/createSignalObject.ts"

export interface UserManagementRolesDialogSetRolesInput {
  readonly roles: readonly string[]
  readonly userId: string
}

export interface UserManagementRolesDialogSetRolesResult {
  readonly success: boolean
  readonly errorMessage: string
}

export interface UserManagementRolesDialogState {
  readonly draftRoles: SignalObject<string[]>
  readonly editingUser: () => UserProjection | undefined
  readonly errorMessage: () => string
  readonly isUpdating: (userId: string) => boolean
  readonly openEdit: (user: UserProjection) => void
  readonly closeEdit: () => void
  readonly saveRoles: () => Promise<void>
  readonly savedUserId: () => string | undefined
}

export function userManagementRolesDialogStateCreate(inputs: {
  readonly setRoles?: (
    input: UserManagementRolesDialogSetRolesInput,
  ) => Promise<UserManagementRolesDialogSetRolesResult>
}): UserManagementRolesDialogState {
  const editingUser = createSignalObject<UserProjection | undefined>(undefined)
  const draftRoles = createSignalObject<string[]>([])
  const errorMessage = createSignalObject("")
  const updatingUserIds = createSignalObject<readonly string[]>([])
  const savedUserId = createSignalObject<string | undefined>(undefined)

  function openEdit(user: UserProjection) {
    errorMessage.set("")
    savedUserId.set(undefined)
    editingUser.set(user)
    draftRoles.set([...user.roles])
  }

  function closeEdit() {
    editingUser.set(undefined)
  }

  async function saveRoles() {
    const user = editingUser.get()
    if (!user) return
    const roles = [...new Set(draftRoles.get())]
    if (roles.length === 0) {
      errorMessage.set("At least one role is required")
      return
    }
    if (!inputs.setRoles) {
      errorMessage.set("Role saving is unavailable: no session")
      return
    }
    updatingUserIds.set([...updatingUserIds.get(), user.userId])
    errorMessage.set("")
    const result = await inputs.setRoles({ roles, userId: user.userId })
    updatingUserIds.set(updatingUserIds.get().filter((id) => id !== user.userId))
    if (!result.success) {
      errorMessage.set(result.errorMessage || "The roles could not be changed.")
      return
    }
    savedUserId.set(user.userId)
    editingUser.set(undefined)
  }

  return {
    draftRoles,
    editingUser: editingUser.get,
    errorMessage: errorMessage.get,
    isUpdating: (userId) => updatingUserIds.get().includes(userId),
    openEdit,
    closeEdit,
    saveRoles,
    savedUserId: savedUserId.get,
  }
}
