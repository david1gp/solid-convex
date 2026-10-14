import { createEffect, onCleanup } from "solid-js"
import type { HierarchyDeleteTarget } from "#src/hierarchy_delete/model/hierarchyDeleteTargetSchema.ts"
import type { HierarchyDeleteConfirmAction } from "#src/hierarchy_delete/ui/hierarchyDeleteConfirmAction.ts"
import { createSignalObject, type SignalObject } from "#ui/utils/createSignalObject.ts"

interface HierarchyDeleteDialogStateInputs {
  target: () => HierarchyDeleteTarget | undefined
  isOpen?: SignalObject<boolean>
  dialogKey?: string
  onConfirm?: HierarchyDeleteConfirmAction
  onSuccess?: () => void
  onClose?: () => void
}

export function hierarchyDeleteDialogStateCreate(inputs: HierarchyDeleteDialogStateInputs) {
  const dialogKey = inputs.dialogKey ?? "delete"

  const getInitialOpen = (): boolean => {
    if (inputs.isOpen) return inputs.isOpen.get()
    if (typeof window === "undefined") return false
    const url = new URL(window.location.href)
    return url.searchParams.has(dialogKey)
  }

  const isOpen = inputs.isOpen ?? createSignalObject(getInitialOpen())

  let idleHandle: number | ReturnType<typeof setTimeout> | undefined

  const syncUrlSearchParam = (open: boolean) => {
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
        if (open) {
          const kind = inputs.target()?.kind ?? "1"
          url.searchParams.set(dialogKey, kind)
        } else {
          url.searchParams.delete(dialogKey)
        }
        window.history.replaceState(null, "", url.toString())
      } catch (err) {
        console.warn("Failed to sync dialog state to URL", err)
      }
    })
  }

  createEffect(() => {
    const open = isOpen.get()
    syncUrlSearchParam(open)
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

  const openDialog = () => {
    isOpen.set(true)
  }

  const closeDialog = () => {
    isOpen.set(false)
    inputs.onClose?.()
  }

  const handleSuccess = () => {
    closeDialog()
    inputs.onSuccess?.()
  }

  return {
    isOpen,
    openDialog,
    closeDialog,
    handleSuccess,
    target: inputs.target,
    onConfirm: inputs.onConfirm,
  }
}
