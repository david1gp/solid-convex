import { createMemo } from "solid-js"
import type { HierarchyDeleteCounts } from "#src/hierarchy_delete/model/hierarchyDeleteCountsSchema.ts"

export interface HierarchyDeletePreviewCountsStateInputs {
  counts: () => HierarchyDeleteCounts | undefined
  isTruncated?: () => boolean
}

export interface HierarchyDeleteCountItem {
  key: string
  label: string
  count: number
}

export function hierarchyDeletePreviewCountsStateCreate(inputs: HierarchyDeletePreviewCountsStateInputs) {
  const currentCounts = createMemo(() => inputs.counts())
  const isTruncated = createMemo(() => inputs.isTruncated?.() ?? false)

  const items = createMemo<HierarchyDeleteCountItem[]>(() => {
    const c = currentCounts()
    if (!c) return []
    return [
      { key: "orgs", label: "Organizations", count: c.orgs },
      { key: "teams", label: "Teams", count: c.teams },
      { key: "projects", label: "Projects", count: c.projects },
      { key: "notes", label: "Notes", count: c.notes },
      { key: "resources", label: "Resources", count: c.resources },
      { key: "files", label: "Files", count: c.files },
      { key: "orgMembers", label: "Organization memberships", count: c.orgMembers ?? 0 },
      { key: "orgInvitations", label: "Invitations", count: c.orgInvitations ?? 0 },
    ]
  })

  const total = createMemo(() => currentCounts()?.total ?? 0)
  const hasItems = createMemo(() => total() > 0)

  return {
    items,
    total,
    hasItems,
    isTruncated,
  }
}
