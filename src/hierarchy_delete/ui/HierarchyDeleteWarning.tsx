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
    <div
      role="alert"
      class="rounded-lg border border-red-300 bg-red-50 p-4 text-red-950 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200 space-y-2"
    >
      <div class="flex items-start gap-2">
        <span class="text-lg font-bold select-none leading-none" aria-hidden="true">
          ⚠️
        </span>
        <div class="space-y-1 flex-1">
          <h3 class="text-sm font-bold text-red-800 dark:text-red-300 leading-tight">{state.title()}</h3>
          <p class="text-xs text-red-700 dark:text-red-300/90 leading-relaxed">{state.description()}</p>
          <Show when={state.accountWarning()}>
            <p class="text-xs font-medium text-amber-800 dark:text-amber-300 leading-relaxed">
              {state.accountWarning()}
            </p>
          </Show>
          <p class="text-xs font-semibold text-red-800 dark:text-red-200">
            This action is permanent and cannot be undone.
          </p>
        </div>
      </div>

      <Show when={state.isTruncated()}>
        <div class="mt-2 rounded border border-amber-400 bg-amber-50 p-2 text-xs font-semibold text-amber-900 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-200">
          {state.truncationWarning()}
        </div>
      </Show>
    </div>
  )
}
