import { type Accessor, Show } from "solid-js"
import type { AssignmentTarget } from "#src/assignment/model/assignmentTargetSchema.ts"
import type { FileModel } from "#src/file/model/FileModel.ts"
import { uploadImageTexts } from "#src/file/model_field/uploadStatus.ts"
import type { UploadAreaFileInfo } from "#src/file/ui/stats/UploadAreaFileInfo.ts"
import { UploadFileStats } from "#src/file/ui/stats/UploadFileStats.tsx"
import { UploadAreaImageView } from "#src/file/ui/upload_image/UploadAreaImageView.tsx"
import { uploadHandlerImage } from "#src/file/ui/upload_image/uploadHandlerImage.tsx"
import type { MayHaveResourceId } from "#src/resource/model/MayHaveResourceId.ts"
import { cn } from "cn"
import type { SignalObject } from "#ui/utils/createSignalObject.ts"
import type { MayHaveClass } from "#ui/utils/MayHaveClass.ts"
import type { MayHaveId } from "#ui/utils/MayHaveId.ts"
import { uploadAreaImageStateCreate } from "./uploadAreaImageStateCreate.ts"

export interface UploadAreaImageProps extends MayHaveResourceId, MayHaveId, MayHaveClass {
  hasUploaded: Accessor<boolean>
  info: SignalObject<UploadAreaFileInfo | null>
  error?: SignalObject<string | null>
  onUploadSuccess?: (file: FileModel) => void
  assignment?: AssignmentTarget | null
  /** Inject local selection handling without entering the production upload transport. */
  onFileSelect?: (file: File) => void | Promise<void>
}

export function UploadAreaImage(p: UploadAreaImageProps) {
  const state = uploadAreaImageStateCreate(p, uploadHandlerImage, uploadImageTexts.onlyImages)

  return (
    <>
      <label for={state.id()} class={cn("flex cursor-pointer flex-col items-center", p.class)}>
        <UploadAreaImageView status={state.status()} error={p.error?.get()} info={p.info.get()} />
      </label>
      <input id={state.id()} type="file" accept="image/*" class="hidden" onChange={state.fileChange} />
      <Show when={p.info.get()}>
        <UploadFileStats info={p.info.get()!} />
      </Show>
    </>
  )
}
