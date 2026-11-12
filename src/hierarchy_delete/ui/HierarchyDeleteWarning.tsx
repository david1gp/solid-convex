import { Show } from "solid-js"
import type { HierarchyDeleteTargetKind } from "#src/hierarchy_delete/model/hierarchyDeleteTargetKindSchema.ts"
import { hierarchyDeleteWarningStateCreate } from "#src/hierarchy_delete/ui/hierarchyDeleteWarningStateCreate.ts"

export interface HierarchyDeleteWarningProps {
  targetKind: () => HierarchyDeleteTargetKind | undefined
  targetName: () => string | undefined
  isTruncated: () => boolean
}

export function HierarchyDeleteWarning(props: HierarchyDeleteWarningProps) {
  const state = hierarchyDeleteWarningStateCreate({
    targetKind: props.targetKind,
    targetName: props.targetName,
    isTruncated: props.isTruncated,
  })

  return (
    <div role="alert" class="rounded-md border border-danger/20 bg-danger-soft px-4 py-3 text-sm space-y-2">
      <div class="flex items-start gap-2">
        <span class="text-lg font-bold select-none leading-none" aria-hidden="true">
          ⚠️
        </span>
        <div class="space-y-1 flex-1">
          <h3 class="text-sm font-semibold text-danger leading-tight">{state.title()}</h3>
          <p class="text-sm text-muted-foreground leading-relaxed">{state.description()}</p>
          <Show when={state.accountWarning()}>
            <p class="text-xs font-medium text-warning leading-relaxed">{state.accountWarning()}</p>
          </Show>
          <p class="text-xs font-semibold text-danger">This action is permanent and cannot be undone.</p>
        </div>
      </div>

      <Show when={state.isTruncated()}>
        <div class="mt-2 rounded-md border border-warning/20 bg-warning-soft p-2 text-xs font-semibold text-warning">
          {state.truncationWarning()}
        </div>
      </Show>
    </div>
  )
}
