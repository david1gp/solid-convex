import { createMemo } from "solid-js"

export interface ResourceDeletionWarningStateInputs {
  count: () => number
  dangerText?: () => string | undefined
}

export function resourceDeletionWarningStateCreate(inputs: ResourceDeletionWarningStateInputs) {
  const defaultDangerText = "This action is permanent and cannot be undone."

  const count = createMemo(() => Math.max(0, inputs.count()))
  const dangerText = createMemo(() => inputs.dangerText?.() ?? defaultDangerText)
  const hasCount = createMemo(() => count() > 0)
  const countLabel = createMemo(() => {
    const currentCount = count()
    return `${currentCount} ${currentCount === 1 ? "resource" : "resources"} will be permanently deleted`
  })

  return {
    count,
    countLabel,
    dangerText,
    hasCount,
  }
}
