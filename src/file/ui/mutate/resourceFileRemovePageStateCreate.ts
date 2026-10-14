import { createMemo } from "solid-js"
import { api } from "#convex/_generated/api.js"
import { userTokenGet } from "#src/auth/ui/signals/userSessionSignal.ts"
import { hierarchyDeleteConfirmationIsValid } from "#src/hierarchy_delete/ui/hierarchyDeleteConfirmationIsValid.ts"
import { urlResourceView } from "#src/resource/url/urlResource.ts"
import { mutationCreate } from "#src/utils/convex_client/mutationCreate.ts"
import { queryCreate } from "#src/utils/convex_client/queryCreate.ts"
import { navigateTo } from "#src/utils/router/navigateTo.ts"
import { toastAdd } from "#ui/interactive/toast/toastAdd.ts"
import { toastVariant } from "#ui/interactive/toast/toastVariant.ts"
import { createSignalObject, type SignalObject } from "#ui/utils/createSignalObject.ts"

export interface FileDeleteEffectItem {
  key: string
  label: string
  count: number
  status: "deleted" | "unlinked" | "retained"
}

export interface ResourceFileRemovePageStateInputs {
  resourceId: () => string
  fileId: () => string
  onSuccess?: () => void
  onCancel?: () => void
}

export interface ResourceFileRemovePageState {
  resourceId: () => string
  fileId: () => string
  displayName: () => string
  isLoading: () => boolean
  errorMessage: () => string | undefined
  typedConfirmation: SignalObject<string>
  isTypedConfirmationValid: () => boolean
  confirmationPlaceholder: () => string
  effects: () => FileDeleteEffectItem[]
  canConfirm: () => boolean
  isSubmitting: SignalObject<boolean>
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export function resourceFileRemovePageStateCreate(
  inputs: ResourceFileRemovePageStateInputs,
): ResourceFileRemovePageState {
  const typedConfirmation = createSignalObject("")
  const isSubmitting = createSignalObject(false)
  const deleteMutation = mutationCreate(api.file.fileDeleteMutation)

  const fileQuery = queryCreate(api.file.fileGetQuery, () => ({
    token: userTokenGet(),
    fileId: inputs.fileId(),
  }))

  const isLoading = createMemo(() => fileQuery() === undefined)

  const errorMessage = createMemo(() => {
    const res = fileQuery()
    if (res && !res.success) return res.errorMessage
    return undefined
  })

  const displayName = createMemo(() => {
    const res = fileQuery()
    if (res && res.success && res.data) {
      return res.data.displayName || res.data.fileId
    }
    return inputs.fileId()
  })

  const effects = createMemo<FileDeleteEffectItem[]>(() => [
    { key: "file", label: "File record (metadata)", count: 1, status: "deleted" },
    { key: "link", label: "Resource relationship", count: 1, status: "unlinked" },
    { key: "storage", label: "R2 storage objects", count: 0, status: "retained" },
  ])

  const isTypedConfirmationValid = createMemo(() => {
    return hierarchyDeleteConfirmationIsValid(typedConfirmation.get(), displayName())
  })

  const confirmationPlaceholder = createMemo(() => {
    const name = displayName().trim()
    if (name.length > 0) {
      return `Type "${name}" or "DELETE" to confirm`
    }
    return 'Type "DELETE" to confirm'
  })

  const canConfirm = createMemo(() => {
    if (isLoading()) return false
    if (errorMessage()) return false
    if (!isTypedConfirmationValid()) return false
    if (isSubmitting.get()) return false
    return true
  })

  const onConfirm = async () => {
    if (!canConfirm()) return
    isSubmitting.set(true)

    try {
      const result = await deleteMutation({
        token: userTokenGet(),
        fileId: inputs.fileId(),
      })
      if (!result.success) {
        toastAdd({ title: result.errorMessage, variant: toastVariant.error })
        isSubmitting.set(false)
        return
      }
      toastAdd({ title: "File deleted", variant: toastVariant.success })
      if (inputs.onSuccess) inputs.onSuccess()
      else navigateTo(urlResourceView(inputs.resourceId()))
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      toastAdd({ title: msg, variant: toastVariant.error })
      isSubmitting.set(false)
    }
  }

  const onCancel = () => {
    if (inputs.onCancel) {
      inputs.onCancel()
      return
    }
    navigateTo(urlResourceView(inputs.resourceId()))
  }

  return {
    resourceId: inputs.resourceId,
    fileId: inputs.fileId,
    displayName,
    isLoading,
    errorMessage,
    typedConfirmation,
    isTypedConfirmationValid,
    confirmationPlaceholder,
    effects,
    canConfirm,
    isSubmitting,
    onConfirm,
    onCancel,
  }
}
