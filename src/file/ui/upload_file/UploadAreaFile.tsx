import { type Accessor, type JSX, Show } from "solid-js"
import type { AssignmentTarget } from "#src/assignment/model/assignmentTargetSchema.ts"
import type { FileModel } from "#src/file/model/FileModel.ts"
import type { UploadAreaFileInfo } from "#src/file/ui/stats/UploadAreaFileInfo.ts"
import { UploadFileStats } from "#src/file/ui/stats/UploadFileStats.tsx"
import { UploadAreaFileView } from "#src/file/ui/upload_file/UploadAreaFileView.tsx"
import { uploadAreaFileStateCreate } from "#src/file/ui/upload_file/uploadAreaFileStateCreate.ts"
import type { MayHaveResourceId } from "#src/resource/model/MayHaveResourceId.ts"
import { cn } from "cn"
import type { SignalObject } from "#ui/utils/createSignalObject.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"
import type { MayHaveId } from "#ui/utils/MayHaveId.ts"

export interface UploadAreaFileProps extends MayHaveResourceId, MayHaveClass, MayHaveId {
  hasUploaded: Accessor<boolean>
  info: SignalObject<UploadAreaFileInfo | null>
  error?: SignalObject<string | null>
  handler?: JSX.ChangeEventHandlerUnion<HTMLInputElement, Event>
  accept?: string
  onUploadSuccess?: (file: FileModel) => void
  assignment?: AssignmentTarget | null
}

export function UploadAreaFile(p: UploadAreaFileProps) {
  const state = uploadAreaFileStateCreate({
    id: () => p.id,
    hasUploaded: p.hasUploaded,
    info: p.info,
    error: p.error,
    handler: p.handler,
    resourceId: p.resourceId,
    assignment: p.assignment,
    onUploadSuccess: p.onUploadSuccess,
  })

  return (
    <>
      <label for={state.id} class={cn("flex cursor-pointer flex-col items-center", p.class)}>
        <UploadAreaFileView status={state.getCurrentStatus()} error={p.error?.get()} info={p.info.get()} />
      </label>
      <input id={state.id} type="file" accept={p.accept} class="hidden" onChange={state.handler} />
      <Show when={p.info.get()}>
        <UploadFileStats info={p.info.get()!} />
      </Show>
    </>
  )
}
