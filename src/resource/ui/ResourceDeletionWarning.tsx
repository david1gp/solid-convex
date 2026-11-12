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
    <div role="alert" class="rounded-md border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
      <div class="flex items-start gap-3">
        <div class="flex-1 space-y-1">
          <p class="text-sm font-semibold leading-none">{state.dangerText()}</p>
          <Show when={state.hasCount()}>
            <p class="text-sm">{state.countLabel()}</p>
          </Show>
        </div>
      </div>
    </div>
  )
}
