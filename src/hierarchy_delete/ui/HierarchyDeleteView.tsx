import { Show } from "solid-js"
import { appIcons } from "#src/app/icon/appIcons.ts"
import type { HierarchyDeleteTarget } from "#src/hierarchy_delete/model/hierarchyDeleteTargetSchema.ts"
import { HierarchyDeletePreviewCounts } from "#src/hierarchy_delete/ui/HierarchyDeletePreviewCounts.tsx"
import { HierarchyDeleteWarning } from "#src/hierarchy_delete/ui/HierarchyDeleteWarning.tsx"
import type { HierarchyDeleteConfirmAction } from "#src/hierarchy_delete/ui/hierarchyDeleteConfirmAction.ts"
import { hierarchyDeleteViewStateCreate } from "#src/hierarchy_delete/ui/hierarchyDeleteViewStateCreate.ts"
import { ButtonIcon } from "#ui/interactive/button/ButtonIcon.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"

export interface HierarchyDeleteViewProps {
  target: () => HierarchyDeleteTarget | undefined
  onCancel?: () => void
  onConfirm?: HierarchyDeleteConfirmAction
  onSuccess?: () => void
}

export function HierarchyDeleteView(props: HierarchyDeleteViewProps) {
  const state = hierarchyDeleteViewStateCreate({
    target: props.target,
    onCancel: props.onCancel,
    onConfirm: props.onConfirm,
    onSuccess: props.onSuccess,
  })

  return (
    <div class="space-y-5 text-foreground max-w-xl mx-auto">
      <header class="space-y-1">
        <h2 class="text-xl font-bold text-destructive">Delete {state.targetKind() ?? "Item"}</h2>
        <p class="text-sm text-muted-foreground">Review the affected hierarchy and confirm permanent deletion.</p>
      </header>

      <Show when={state.isPreviewLoading()}>
        <div class="rounded-md border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground space-y-2">
          <p class="animate-pulse font-medium">Calculating cascading deletion preview…</p>
          <p class="text-xs">Scanning descendant entities, resources, and storage files.</p>
        </div>
      </Show>

      <Show when={state.previewError()}>
        {(errorMessage) => (
          <div role="alert" class="rounded-md border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
            <p class="font-semibold">Unable to load deletion preview</p>
            <p class="mt-1 text-xs">{errorMessage()}</p>
          </div>
        )}
      </Show>

      <Show when={state.preview()}>
        <div class="space-y-4">
          <HierarchyDeleteWarning
            targetKind={state.targetKind}
            targetName={state.rootName}
            isTruncated={state.isTruncated}
          />

          <HierarchyDeletePreviewCounts counts={state.counts} isTruncated={state.isTruncated} />

          <div class="space-y-2 pt-2 border-t border-border">
            <label for="hierarchy-delete-confirm-input" class="block text-xs font-semibold text-foreground">
              Type <strong class="font-bold underline">{state.rootName() || "DELETE"}</strong> or{" "}
              <strong class="font-bold underline">DELETE</strong> to confirm:
            </label>
            <input
              id="hierarchy-delete-confirm-input"
              type="text"
              class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive focus:border-destructive"
              placeholder={state.confirmationPlaceholder()}
              value={state.typedConfirmation.get()}
              onInput={(e) => state.typedConfirmation.set(e.currentTarget.value)}
              disabled={
                state.isPreviewLoading() ||
                state.jobStatus.get() === "submitting" ||
                state.jobStatus.get() === "in_progress" ||
                state.jobStatus.get() === "completed"
              }
            />
            <Show when={state.typedConfirmation.get().length > 0 && !state.isTypedConfirmationValid()}>
              <p class="text-xs text-destructive">Input does not match the name or "DELETE".</p>
            </Show>
          </div>
        </div>
      </Show>

      <Show when={state.jobStatus.get() === "submitting" || state.jobStatus.get() === "in_progress"}>
        <div class="rounded-md border border-primary/20 bg-accent-soft px-4 py-3 text-xs text-foreground space-y-1">
          <p class="font-semibold">{state.jobProgressMessage.get()}</p>
          <p class="text-muted-foreground">Please keep this window open while the deletion cascade processes.</p>
        </div>
      </Show>

      <Show when={state.jobStatus.get() === "completed"}>
        <div class="rounded-md border border-success/20 bg-success-soft px-4 py-3 text-xs text-success">
          <p class="font-semibold">{state.jobProgressMessage.get()}</p>
        </div>
      </Show>

      <Show when={state.jobError.get()}>
        {(err) => (
          <div role="alert" class="rounded-md border border-danger/20 bg-danger-soft px-4 py-3 text-xs text-danger">
            <p class="font-semibold">Deletion failed</p>
            <p class="mt-1">{err()}</p>
          </div>
        )}
      </Show>

      <div class="flex items-center justify-end gap-3 pt-3 border-t border-border">
        <ButtonIcon
          type="button"
          icon={appIcons.cancel}
          variant={buttonVariant.outline}
          onClick={state.onCancel}
          disabled={state.jobStatus.get() === "submitting" || state.jobStatus.get() === "in_progress"}
        >
          Cancel
        </ButtonIcon>
        <Show when={state.canRetry()}>
          <ButtonIcon type="button" icon={appIcons.retry} variant={buttonVariant.filled} onClick={state.onRetryClick}>
            Retry Deletion
          </ButtonIcon>
        </Show>
        <Show when={!state.canRetry()}>
          <ButtonIcon
            type="button"
            icon={appIcons.dangerDelete}
            variant={buttonVariant.filledRed}
            onClick={state.onConfirmClick}
            disabled={!state.canConfirm()}
          >
            {state.jobStatus.get() === "submitting" || state.jobStatus.get() === "in_progress"
              ? "Deleting…"
              : "Permanently Delete"}
          </ButtonIcon>
        </Show>
      </div>
    </div>
  )
}
