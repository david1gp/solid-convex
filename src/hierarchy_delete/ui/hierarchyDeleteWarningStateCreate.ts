import { createMemo } from "solid-js"
import type { HierarchyDeleteTargetKind } from "#src/hierarchy_delete/model/hierarchyDeleteTargetKindSchema.ts"

export interface HierarchyDeleteWarningStateInputs {
  targetKind: () => HierarchyDeleteTargetKind | undefined
  targetName: () => string | undefined
  isTruncated: () => boolean
}

export function hierarchyDeleteWarningStateCreate(inputs: HierarchyDeleteWarningStateInputs) {
  const kind = createMemo(() => inputs.targetKind() ?? "item")
  const name = createMemo(() => inputs.targetName() ?? "")
  const isTruncated = createMemo(() => inputs.isTruncated())

  const title = createMemo(() => {
    const k = kind()
    const n = name()
    if (n) {
      return `Permanently delete ${k} "${n}"?`
    }
    return `Permanently delete this ${k}?`
  })

  const description = createMemo(() => {
    const k = kind()
    if (k === "org") {
      return "This organization and ALL descendant teams, projects, notes, and attached resources and files in this subtree will be permanently destroyed."
    }
    if (k === "team") {
      return "This team and ALL descendant projects, notes, and attached resources and files will be permanently destroyed."
    }
    if (k === "project") {
      return "This project and ALL descendant notes, and attached resources and files will be permanently destroyed."
    }
    return "This note and any directly attached resources and files will be permanently destroyed."
  })

  const truncationWarning = createMemo(() => {
    if (!isTruncated()) return ""
    return "Warning: The affected scope exceeds the query limit and was truncated. Deletion is blocked to prevent untracked data destruction."
  })

  const accountWarning = createMemo(() => {
    if (kind() === "org") {
      return "User accounts themselves are not deleted."
    }
    return ""
  })

  return {
    title,
    description,
    accountWarning,
    truncationWarning,
    isTruncated,
  }
}
