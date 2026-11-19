import { createMemo, createRenderEffect } from "solid-js"
import { api } from "#convex/_generated/api.js"
import type { Id } from "#convex/_generated/dataModel.js"
import type { Result } from "#result"
import { userTokenGet } from "#src/auth/ui/signals/userSessionSignal.ts"
import type { HierarchyDeleteCounts } from "#src/hierarchy_delete/model/hierarchyDeleteCountsSchema.ts"
import type { HierarchyDeletePreview } from "#src/hierarchy_delete/model/hierarchyDeletePreviewSchema.ts"
import type { HierarchyDeleteTargetKind } from "#src/hierarchy_delete/model/hierarchyDeleteTargetKindSchema.ts"
import type { HierarchyDeleteTarget } from "#src/hierarchy_delete/model/hierarchyDeleteTargetSchema.ts"
import type { HierarchyDeleteConfirmAction } from "#src/hierarchy_delete/ui/hierarchyDeleteConfirmAction.ts"
import { hierarchyDeleteConfirmationIsValid } from "#src/hierarchy_delete/ui/hierarchyDeleteConfirmationIsValid.ts"
import type { HierarchyDeleteConfirmPayload } from "#src/hierarchy_delete/ui/hierarchyDeleteConfirmPayloadSchema.ts"
import type { HierarchyDeleteJobStatus } from "#src/hierarchy_delete/ui/hierarchyDeleteJobStatus.ts"
import { mutationCreate } from "#src/utils/convex_client/mutationCreate.ts"
import { queryCreate } from "#src/utils/convex_client/queryCreate.ts"
import { createSignalObject, type SignalObject } from "#ui/utils/createSignalObject.ts"

export interface HierarchyDeleteViewStateInputs {
  target: () => HierarchyDeleteTarget | undefined
  onCancel?: () => void
  onConfirm?: HierarchyDeleteConfirmAction
  onRetry?: (jobId: string) => Promise<Result<unknown>>
  onSuccess?: () => void
}

export interface HierarchyDeleteViewState {
  target: () => HierarchyDeleteTarget | undefined
  targetKind: () => HierarchyDeleteTargetKind | undefined
  rootName: () => string
  counts: () => HierarchyDeleteCounts | undefined
  preview: () => HierarchyDeletePreview | undefined
  fingerprint: () => string
  isPreviewLoading: () => boolean
  previewError: () => string | undefined
  isTruncated: () => boolean
  isFingerprintStale: () => boolean
  typedConfirmation: SignalObject<string>
  isTypedConfirmationValid: () => boolean
  confirmationPlaceholder: () => string
  canConfirm: () => boolean
  canRetry: () => boolean
  activeJobId: () => string | undefined
  jobStatus: SignalObject<HierarchyDeleteJobStatus>
  jobProgressMessage: SignalObject<string>
  jobError: SignalObject<string>
  onCancel: () => void
  onConfirmClick: () => Promise<void>
  onRetryClick: () => Promise<void>
}

export function hierarchyDeleteViewStateCreate(inputs: HierarchyDeleteViewStateInputs): HierarchyDeleteViewState {
  const typedConfirmation = createSignalObject("")
  const currentJobId = createSignalObject<string | undefined>(undefined)
  const jobStatus = createSignalObject<HierarchyDeleteJobStatus>("idle")
  const jobProgressMessage = createSignalObject("")
  const jobError = createSignalObject("")
  const frozenPreview = createSignalObject<HierarchyDeletePreview | undefined>(undefined)

  const confirmMutation = mutationCreate(api.hierarchyDelete.hierarchyDeleteConfirmMutation)
  const retryMutation = mutationCreate(api.hierarchyDeleteControl.hierarchyDeleteRetryMutation)

  const previewQueryResult = queryCreate(api.hierarchyDelete.hierarchyDeletePreviewQuery, () => {
    const t = inputs.target()
    return {
      token: userTokenGet(),
      kind: t?.kind ?? "org",
      orgId: (t?.orgId as unknown as Id<"orgs">) || undefined,
      orgHandle: t?.orgHandle,
      teamId: (t?.teamId as unknown as Id<"teams">) || undefined,
      projectId: (t?.projectId as unknown as Id<"projects">) || undefined,
      noteId: (t?.noteId as unknown as Id<"notes">) || undefined,
    }
  })

  const preview = createMemo(() => {
    const frozen = frozenPreview.get()
    if (currentJobId.get() && frozen) {
      return frozen
    }
    const res = previewQueryResult()
    if (!res || !res.success) return frozen
    return res.data
  })

  const isPreviewLoading = createMemo(() => {
    if (currentJobId.get()) return false
    if (!inputs.target()) return false
    return previewQueryResult() === undefined
  })

  const previewError = createMemo(() => {
    if (currentJobId.get()) return undefined
    if (!inputs.target()) return "No target specified for deletion"
    const res = previewQueryResult()
    if (res && !res.success) return res.errorMessage
    return undefined
  })

  const targetKind = createMemo(() => {
    const p = preview()
    if (p) return p.root.kind
    return inputs.target()?.kind
  })

  const rootName = createMemo(() => {
    const p = preview()
    if (p) {
      return p.root.name || p.root.orgHandle || p.root.id
    }
    return ""
  })

  const counts = createMemo(() => {
    const frozen = frozenPreview.get()
    if (currentJobId.get()) {
      if (frozen?.counts) {
        return frozen.counts
      }
      const res = statusQueryResult()
      if (res && res.success && res.data.job?.counts) {
        return res.data.job.counts
      }
    }
    return preview()?.counts
  })

  const isTruncated = createMemo(() => preview()?.isTruncated ?? false)
  const fingerprint = createMemo(() => {
    const frozen = frozenPreview.get()
    if (currentJobId.get() && frozen) {
      return frozen.fingerprint
    }
    return preview()?.fingerprint ?? ""
  })
  const isFingerprintStale = createMemo(() => !fingerprint())

  // Reset typed confirmation whenever selected root or preconfirm fingerprint changes.
  // When target changes to a new entity, clear previous job snapshot.
  let lastRootKey: string | undefined
  let lastFingerprint: string | undefined
  createRenderEffect(
    () => {
      const t = inputs.target()
      const rootKey = t
        ? `${t.kind}:${t.orgId ?? ""}:${t.orgHandle ?? ""}:${t.teamId ?? ""}:${t.projectId ?? ""}:${t.noteId ?? ""}`
        : ""
      return { rootKey, currentFp: fingerprint(), jobId: currentJobId.get() }
    },
    ({ rootKey, currentFp, jobId }) => {
      if (lastRootKey !== undefined && rootKey !== lastRootKey) {
        typedConfirmation.set("")
        currentJobId.set(undefined)
        frozenPreview.set(undefined)
        jobStatus.set("idle")
        jobProgressMessage.set("")
        jobError.set("")
      } else if (!jobId && lastFingerprint !== undefined && currentFp !== lastFingerprint) {
        typedConfirmation.set("")
      }

      lastRootKey = rootKey
      lastFingerprint = currentFp
    },
  )

  const isTypedConfirmationValid = createMemo(() => {
    return hierarchyDeleteConfirmationIsValid(typedConfirmation.get(), rootName())
  })

  const confirmationPlaceholder = createMemo(() => {
    const name = rootName().trim()
    if (name.length > 0) {
      return `Type "${name}" or "DELETE" to confirm`
    }
    return 'Type "DELETE" to confirm'
  })

  const canConfirm = createMemo(() => {
    if (isPreviewLoading()) return false
    if (previewError()) return false
    if (isTruncated()) return false
    if (isFingerprintStale()) return false
    if (!isTypedConfirmationValid()) return false
    const status = jobStatus.get()
    if (status === "submitting" || status === "in_progress" || status === "completed") return false
    return true
  })

  const canRetry = createMemo(() => {
    return jobStatus.get() === "error" && Boolean(currentJobId.get())
  })

  const statusQueryResult = queryCreate(api.hierarchyDelete.hierarchyDeleteStatusQuery, () => {
    const activeId = currentJobId.get()
    if (activeId) {
      return {
        token: userTokenGet(),
        jobId: activeId,
      }
    }
    const t = inputs.target()
    return {
      token: userTokenGet(),
      kind: t?.kind ?? "org",
      orgId: (t?.orgId as unknown as Id<"orgs">) || undefined,
      orgHandle: t?.orgHandle,
      teamId: (t?.teamId as unknown as Id<"teams">) || undefined,
      projectId: (t?.projectId as unknown as Id<"projects">) || undefined,
      noteId: (t?.noteId as unknown as Id<"notes">) || undefined,
    }
  })

  // Reactive subscription: watch status query by returned jobId
  createRenderEffect(
    () => ({
      res: statusQueryResult(),
      currentId: currentJobId.get(),
      currentPreview: preview(),
      frozen: frozenPreview.get(),
    }),
    ({ res, currentId, currentPreview, frozen }) => {
      if (!res || !res.success) return
      const job = res.data.job
      if (!job) return

      // If an active job exists on target but currentJobId is unset, bind it
      if (!currentId && (job.status === "pending" || job.status === "in_progress" || job.status === "failed")) {
        currentJobId.set(job.jobId)
        if (currentPreview && !frozen) {
          frozenPreview.set(currentPreview)
        }
      }

      if (
        currentId === job.jobId ||
        (!currentId && (job.status === "pending" || job.status === "in_progress" || job.status === "failed"))
      ) {
        if (job.status === "pending") {
          jobStatus.set("submitting")
          jobProgressMessage.set("Deletion queued…")
        } else if (job.status === "in_progress") {
          jobStatus.set("in_progress")
          jobProgressMessage.set("Processing deletion cascade…")
        } else if (job.status === "completed") {
          jobStatus.set("completed")
          jobProgressMessage.set("Deletion completed successfully.")
          inputs.onSuccess?.()
        } else if (job.status === "failed" || (job.status as string) === "error") {
          jobStatus.set("error")
          jobError.set(job.error ?? "Deletion failed")
        }
      }
    },
  )

  const onCancel = () => {
    typedConfirmation.set("")
    currentJobId.set(undefined)
    frozenPreview.set(undefined)
    jobStatus.set("idle")
    jobProgressMessage.set("")
    jobError.set("")
    inputs.onCancel?.()
  }

  const onConfirmClick = async (): Promise<void> => {
    if (!canConfirm()) return
    const currentTarget = inputs.target()
    const currentFingerprint = fingerprint()
    if (!currentTarget || !currentFingerprint) return

    const currentPreview = preview()
    if (currentPreview && !frozenPreview.get()) {
      frozenPreview.set(currentPreview)
    }

    jobStatus.set("submitting")
    jobProgressMessage.set("Submitting deletion job…")
    jobError.set("")

    const payload: HierarchyDeleteConfirmPayload = {
      target: currentTarget,
      fingerprint: currentFingerprint,
      confirmedNameOrDelete: typedConfirmation.get().trim(),
    }

    if (inputs.onConfirm) {
      jobStatus.set("in_progress")
      jobProgressMessage.set("Processing deletion cascade…")
      const result = await inputs.onConfirm(payload)
      if (!result.success) {
        frozenPreview.set(undefined)
        jobStatus.set("error")
        jobError.set(result.errorMessage)
        return
      }

      const returnedJobId = (result.data as { jobId?: string } | undefined)?.jobId
      if (returnedJobId) {
        currentJobId.set(returnedJobId)
        const returnedStatus = (result.data as { status?: string } | undefined)?.status
        if (returnedStatus === "completed") {
          jobStatus.set("completed")
          jobProgressMessage.set("Deletion completed successfully.")
          inputs.onSuccess?.()
        }
        return
      }

      // If no jobId was returned from custom confirm handler, conclude successfully
      jobStatus.set("completed")
      jobProgressMessage.set("Deletion completed successfully.")
      inputs.onSuccess?.()
      return
    }

    jobStatus.set("in_progress")
    jobProgressMessage.set("Submitting deletion job…")
    const res = await confirmMutation({
      token: userTokenGet(),
      kind: currentTarget.kind,
      orgId: (currentTarget.orgId as unknown as Id<"orgs">) || undefined,
      orgHandle: currentTarget.orgHandle,
      teamId: (currentTarget.teamId as unknown as Id<"teams">) || undefined,
      projectId: (currentTarget.projectId as unknown as Id<"projects">) || undefined,
      noteId: (currentTarget.noteId as unknown as Id<"notes">) || undefined,
      fingerprint: currentFingerprint,
    })

    if (!res.success) {
      frozenPreview.set(undefined)
      jobStatus.set("error")
      jobError.set(res.errorMessage ?? "Deletion failed")
      return
    }

    const returnedJobId = res.data?.jobId
    if (returnedJobId) {
      currentJobId.set(returnedJobId)
      jobStatus.set("in_progress")
      jobProgressMessage.set("Processing deletion cascade…")
      if (res.data?.status === "completed") {
        jobStatus.set("completed")
        jobProgressMessage.set("Deletion completed successfully.")
        inputs.onSuccess?.()
      }
      return
    }

    jobStatus.set("completed")
    jobProgressMessage.set("Deletion job completed successfully.")
    inputs.onSuccess?.()
  }

  const onRetryClick = async (): Promise<void> => {
    const jobId = currentJobId.get()
    if (!jobId || !canRetry()) return

    jobStatus.set("in_progress")
    jobProgressMessage.set("Retrying deletion…")
    jobError.set("")

    if (inputs.onRetry) {
      const result = await inputs.onRetry(jobId)
      if (!result.success) {
        jobStatus.set("error")
        jobError.set(result.errorMessage)
        return
      }
      return
    }

    const res = await retryMutation({
      token: userTokenGet(),
      jobId,
    })

    if (!res.success) {
      jobStatus.set("error")
      jobError.set(res.errorMessage ?? "Retry failed")
      return
    }
  }

  return {
    target: inputs.target,
    targetKind,
    rootName,
    counts,
    preview,
    fingerprint,
    isPreviewLoading,
    previewError,
    isTruncated,
    isFingerprintStale,
    typedConfirmation,
    isTypedConfirmationValid,
    confirmationPlaceholder,
    canConfirm,
    canRetry,
    activeJobId: () => currentJobId.get(),
    jobStatus,
    jobProgressMessage,
    jobError,
    onCancel,
    onConfirmClick,
    onRetryClick,
  }
}
