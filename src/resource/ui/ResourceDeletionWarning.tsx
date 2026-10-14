import { Show } from "solid-js"
import { resourceDeletionWarningStateCreate } from "#src/resource/ui/resourceDeletionWarningStateCreate.ts"

export interface ResourceDeletionWarningProps {
  count: number
  dangerText?: string
}

export function ResourceDeletionWarning(props: ResourceDeletionWarningProps) {
  const state = resourceDeletionWarningStateCreate({
    count: () => props.count,
    dangerText: () => props.dangerText,
  })

  return (
    <div
      role="alert"
      class="rounded-lg border border-red-200 bg-red-50 p-4 text-red-900 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-200"
    >
      <div class="flex items-start gap-3">
        <div class="flex-1 space-y-1">
          <p class="text-sm font-semibold leading-none text-red-800 dark:text-red-300">{state.dangerText()}</p>
          <Show when={state.hasCount()}>
            <p class="text-sm text-red-700 dark:text-red-400">{state.countLabel()}</p>
          </Show>
        </div>
      </div>
    </div>
  )
}
