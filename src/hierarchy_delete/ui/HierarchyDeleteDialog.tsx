import Dialog from "@corvu/dialog"
import { type JSX, Show } from "solid-js"
import type { HierarchyDeleteTarget } from "#src/hierarchy_delete/model/hierarchyDeleteTargetSchema.ts"
import { HierarchyDeleteView } from "#src/hierarchy_delete/ui/HierarchyDeleteView.tsx"
import type { HierarchyDeleteConfirmAction } from "#src/hierarchy_delete/ui/hierarchyDeleteConfirmAction.ts"
import { hierarchyDeleteDialogStateCreate } from "#src/hierarchy_delete/ui/hierarchyDeleteDialogStateCreate.ts"
import { classesDialogContentMerge, classesDialogOverlayMerge } from "#ui/interactive/dialog/classesDialogContent.js"
import type { SignalObject } from "#ui/utils/createSignalObject.ts"

interface HierarchyDeleteDialogProps {
  target: () => HierarchyDeleteTarget | undefined
  isOpen?: SignalObject<boolean>
  dialogKey?: string
  onConfirm?: HierarchyDeleteConfirmAction
  onSuccess?: () => void
  onClose?: () => void
  trigger?: (openDialog: () => void) => JSX.Element
}

export function HierarchyDeleteDialog(props: HierarchyDeleteDialogProps) {
  const state = hierarchyDeleteDialogStateCreate({
    target: props.target,
    isOpen: props.isOpen,
    dialogKey: props.dialogKey,
    onConfirm: props.onConfirm,
    onSuccess: props.onSuccess,
    onClose: props.onClose,
  })

  return (
    <>
      <Show when={props.trigger}>{(renderTrigger) => renderTrigger()(state.openDialog)}</Show>

      <Dialog
        open={state.isOpen.get()}
        onOpenChange={(open) => {
          if (!open) state.closeDialog()
          else state.openDialog()
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay class={classesDialogOverlayMerge()} />
          <Dialog.Content class={classesDialogContentMerge("w-full max-w-lg")}>
            <HierarchyDeleteView
              target={state.target}
              onCancel={state.closeDialog}
              onConfirm={state.onConfirm}
              onSuccess={state.handleSuccess}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  )
}
