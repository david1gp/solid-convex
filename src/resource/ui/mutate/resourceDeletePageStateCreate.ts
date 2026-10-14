import { createMemo } from "solid-js"
import { api } from "#convex/_generated/api.js"
import { userTokenGet } from "#src/auth/ui/signals/userSessionSignal.ts"
import { hierarchyDeleteConfirmationIsValid } from "#src/hierarchy_delete/ui/hierarchyDeleteConfirmationIsValid.ts"
import type { ResourceModel } from "#src/resource/model/ResourceModel.ts"
import type { ResourceFormStateManagement } from "#src/resource/ui/form/resourceFormStateManagement.ts"
import { urlResourceList, urlResourceView } from "#src/resource/url/urlResource.ts"
import { mutationCreate } from "#src/utils/convex_client/mutationCreate.ts"
import { queryCreate } from "#src/utils/convex_client/queryCreate.ts"
import { navigateTo } from "#src/utils/router/navigateTo.ts"
import { toastAdd } from "#ui/interactive/toast/toastAdd.ts"
import { toastVariant } from "#ui/interactive/toast/toastVariant.ts"
import { createSignalObject, type SignalObject } from "#ui/utils/createSignalObject.ts"

export interface ResourceDeleteEffectItem {
  key: string
  label: string
  count: number
  status: "deleted" | "unlinked" | "retained"
}

export interface ResourceDeletePageStateInputs {
  resourceId: () => string
  demo?: () => { resourceId: string; resource: ResourceModel; form: ResourceFormStateManagement } | undefined
  onSuccess?: () => void
  onCancel?: () => void
}

export interface ResourceDeletePageState {
  resourceId: () => string
  title: () => string
  linkedFilesCount: () => number
  isTruncated: () => boolean
  isLoading: () => boolean
  errorMessage: () => string | undefined
  typedConfirmation: SignalObject<string>
  isTypedConfirmationValid: () => boolean
  confirmationPlaceholder: () => string
  effects: () => ResourceDeleteEffectItem[]
  canConfirm: () => boolean
  isSubmitting: SignalObject<boolean>
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export function resourceDeletePageStateCreate(inputs: ResourceDeletePageStateInputs): ResourceDeletePageState {
  const typedConfirmation = createSignalObject("")
  const isSubmitting = createSignalObject(false)
  const deleteMutation = mutationCreate(api.resource.resourceDeleteMutation)

  const isDemo = createMemo(() => Boolean(inputs.demo?.()))

  const previewQuery = queryCreate(api.resource.resourceDeletePreviewQuery, () => ({
    token: userTokenGet(),
    resourceId: inputs.resourceId(),
  }))

  const isLoading = createMemo(() => {
    if (isDemo()) return false
    return previewQuery() === undefined
  })

  const errorMessage = createMemo(() => {
    if (isDemo()) return undefined
    const res = previewQuery()
    if (res && !res.success) return res.errorMessage
    return undefined
  })

  const title = createMemo(() => {
    if (isDemo()) {
      return inputs.demo?.()?.resource.name || inputs.demo?.()?.resource.resourceId || "Resource"
    }
    const res = previewQuery()
    if (res && res.success) {
      return res.data.name || res.data.resourceId
    }
    return inputs.resourceId()
  })

  const linkedFilesCount = createMemo(() => {
    if (isDemo()) return 0
    const res = previewQuery()
    if (res && res.success) return res.data.linkedFilesCount
    return 0
  })

  const isTruncated = createMemo(() => {
    if (isDemo()) return false
    const res = previewQuery()
    if (res && res.success) return res.data.isTruncated
    return false
  })

  const effects = createMemo<ResourceDeleteEffectItem[]>(() => [
    { key: "resource", label: "Resource metadata", count: 1, status: "deleted" },
    { key: "links", label: "Linked file relationships", count: linkedFilesCount(), status: "unlinked" },
    { key: "files", label: "File records (files table)", count: 0, status: "retained" },
    { key: "storage", label: "R2 storage objects", count: 0, status: "retained" },
  ])

  const isTypedConfirmationValid = createMemo(() => {
    return hierarchyDeleteConfirmationIsValid(typedConfirmation.get(), title())
  })

  const confirmationPlaceholder = createMemo(() => {
    const t = title().trim()
    if (t.length > 0) {
      return `Type "${t}" or "DELETE" to confirm`
    }
    return 'Type "DELETE" to confirm'
  })

  const canConfirm = createMemo(() => {
    if (isLoading()) return false
    if (errorMessage()) return false
    if (isTruncated()) return false
    if (!isTypedConfirmationValid()) return false
    if (isSubmitting.get()) return false
    return true
  })

  const onConfirm = async () => {
    if (!canConfirm()) return
    isSubmitting.set(true)

    if (isDemo()) {
      await inputs.demo?.()?.form.handleSubmit({ preventDefault() {} } as unknown as SubmitEvent)
      isSubmitting.set(false)
      if (inputs.onSuccess) inputs.onSuccess()
      else navigateTo(urlResourceList())
      return
    }

    try {
      const result = await deleteMutation({
        token: userTokenGet(),
        resourceId: inputs.resourceId(),
      })
      if (!result.success) {
        toastAdd({ title: result.errorMessage, variant: toastVariant.error })
        isSubmitting.set(false)
        return
      }
      toastAdd({ title: "Resource deleted", variant: toastVariant.success })
      if (inputs.onSuccess) inputs.onSuccess()
      else navigateTo(urlResourceList())
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
    title,
    linkedFilesCount,
    isTruncated,
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
