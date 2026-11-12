import { For, Show } from "solid-js"
import type { HierarchyDeleteCounts } from "#src/hierarchy_delete/model/hierarchyDeleteCountsSchema.ts"
import { hierarchyDeletePreviewCountsStateCreate } from "#src/hierarchy_delete/ui/hierarchyDeletePreviewCountsStateCreate.ts"

export interface HierarchyDeletePreviewCountsProps {
  counts: () => HierarchyDeleteCounts | undefined
  isTruncated?: () => boolean
}

export function HierarchyDeletePreviewCounts(props: HierarchyDeletePreviewCountsProps) {
  const state = hierarchyDeletePreviewCountsStateCreate({
    counts: props.counts,
    isTruncated: props.isTruncated,
  })

  return (
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h4 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Affected Items</h4>
        <span class="text-xs font-medium text-muted-foreground">
          Total: <strong class="text-foreground">{state.total()}</strong>
        </span>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <For each={state.items()}>
          {(item) => (
            <div class="flex items-center justify-between rounded-md border border-border-subtle bg-muted/40 px-3 py-2 text-sm">
              <span class="text-muted-foreground">{item.label}</span>
              <span class="font-semibold tabular-nums text-foreground">{item.count}</span>
            </div>
          )}
        </For>
      </div>

      <Show when={state.isTruncated()}>
        <p class="text-xs text-warning">* Item count exceeds query limit and was truncated.</p>
      </Show>
    </div>
  )
}
