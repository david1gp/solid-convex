import { createEffect, onCleanup } from "solid-js"
import * as v from "valibot"
import type { UserProjection } from "#src/user_management/model/userProjectionSchema.ts"
import { stringSchemaId } from "#src/utils/valibot/stringSchema.ts"
import { createSignalObject, type SignalObject } from "#ui/utils/createSignalObject.ts"

const dialogUserIdSchema = stringSchemaId

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
  readonly dialogKey?: string
  readonly members?: () => readonly UserProjection[]
}): UserManagementRolesDialogState {
  const dialogKey = inputs.dialogKey ?? "editRoles"
  const editingUser = createSignalObject<UserProjection | undefined>(undefined)
  const draftRoles = createSignalObject<string[]>([])
  const errorMessage = createSignalObject("")
  const updatingUserIds = createSignalObject<readonly string[]>([])
  const savedUserId = createSignalObject<string | undefined>(undefined)

  let idleHandle: number | ReturnType<typeof setTimeout> | undefined

  function syncUrlSearchParam(userId: string | undefined) {
    if (typeof window === "undefined") return
    if (idleHandle !== undefined) {
      if (typeof window.cancelIdleCallback === "function" && typeof idleHandle === "number") {
        window.cancelIdleCallback(idleHandle)
      } else {
        clearTimeout(idleHandle as ReturnType<typeof setTimeout>)
      }
    }
    const schedule =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback
        : (callback: () => void) => setTimeout(callback, 0)
    idleHandle = schedule(() => {
      try {
        const url = new URL(window.location.href)
        if (userId) {
          url.searchParams.set(dialogKey, userId)
        } else {
          url.searchParams.delete(dialogKey)
        }
        window.history.replaceState(null, "", url.toString())
      } catch (error) {
        console.warn("Failed to sync roles dialog state to URL", error)
      }
    })
  }

  function dialogUserIdFromUrl(): string | undefined {
    if (typeof window === "undefined") return undefined
    try {
      const raw = new URL(window.location.href).searchParams.get(dialogKey)
      if (raw === null) return undefined
      const parsed = v.safeParse(dialogUserIdSchema, raw)
      return parsed.success ? parsed.output : undefined
    } catch {
      return undefined
    }
  }

  function openEdit(user: UserProjection) {
    errorMessage.set("")
    savedUserId.set(undefined)
    editingUser.set(user)
    draftRoles.set([...user.roles])
    syncUrlSearchParam(user.userId)
  }

  function closeEdit() {
    editingUser.set(undefined)
    syncUrlSearchParam(undefined)
  }

  function restoreFromUrl() {
    const userId = dialogUserIdFromUrl()
    const current = editingUser.get()
    if (!userId) {
      if (current) editingUser.set(undefined)
      return
    }
    if (current?.userId === userId) return
    const match = inputs.members?.().find((member) => member.userId === userId)
    if (match) {
      errorMessage.set("")
      savedUserId.set(undefined)
      editingUser.set(match)
      draftRoles.set([...match.roles])
    }
  }

  if (typeof window !== "undefined") {
    restoreFromUrl()
    window.addEventListener("popstate", restoreFromUrl)
    onCleanup(() => {
      window.removeEventListener("popstate", restoreFromUrl)
    })
  }

  createEffect(
    () => inputs.members?.(),
    (members) => {
      if (!members || members.length === 0) return
      restoreFromUrl()
    },
  )

  onCleanup(() => {
    if (idleHandle !== undefined && typeof window !== "undefined") {
      if (typeof window.cancelIdleCallback === "function" && typeof idleHandle === "number") {
        window.cancelIdleCallback(idleHandle)
      } else {
        clearTimeout(idleHandle as ReturnType<typeof setTimeout>)
      }
    }
  })

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
    syncUrlSearchParam(undefined)
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
