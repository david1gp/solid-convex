import { type Accessor, type JSX, Show } from "solid-js"
import type { AssignmentTarget } from "#src/assignment/model/assignmentTargetSchema.ts"
import type { FileModel } from "#src/file/model/FileModel.ts"
import { type UploadStatus, uploadStatus } from "#src/file/model_field/uploadStatus.ts"
import type { UploadAreaFileInfo } from "#src/file/ui/stats/UploadAreaFileInfo.ts"
import { UploadFileStats } from "#src/file/ui/stats/UploadFileStats.tsx"
import { UploadAreaFileView } from "#src/file/ui/upload_file/UploadAreaFileView.tsx"
import { uploadHandlerFile } from "#src/file/ui/upload_file/uploadHandlerFile.tsx"
import type { MayHaveResourceId } from "#src/resource/model/MayHaveResourceId.ts"
import { classMerge } from "#ui/utils/classMerge.ts"
import type { SignalObject } from "#ui/utils/createSignalObject.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"
import type { MayHaveId } from "#ui/utils/MayHaveId.ts"
import { generateId12 } from "#utils/ran/generateId12.js"

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
  if (!p.id) p.id = generateId12()

  const handler = p.handler ?? createFileChangeHandler(p)

  const getCurrentStatus = () => getUploadStatus(p.error?.get() ?? null, p.info.get(), p.hasUploaded())

  return (
    <>
      <label for={p.id} class={classMerge("flex cursor-pointer flex-col items-center", p.class)}>
        <UploadAreaFileView status={getCurrentStatus()} error={p.error?.get()} info={p.info.get()} />
      </label>
      <input id={p.id} type="file" accept={p.accept} class="hidden" onChange={handler} />
      <Show when={p.info.get()}>
        <UploadFileStats info={p.info.get()!} />
      </Show>
    </>
  )
}

function getUploadStatus(error: string | null, info: UploadAreaFileInfo | null, hasUploaded: boolean): UploadStatus {
  if (error) return uploadStatus.error
  if (info) return uploadStatus.uploading
  if (hasUploaded) return uploadStatus.uploaded
  return uploadStatus.empty
}

function createFileChangeHandler(p: UploadAreaFileProps): JSX.ChangeEventHandlerUnion<HTMLInputElement, Event> {
  return async (e) => {
    const files = e.currentTarget.files
    if (!files || !files[0]) return

    const file = files[0]

    await uploadHandlerFile({
      file,
      uploadInfo: p.info,
      uploadError: p.error,
      resourceId: p.resourceId,
      assignment: p.assignment,
      onUploadSuccess: p.onUploadSuccess,
    })
  }
}
