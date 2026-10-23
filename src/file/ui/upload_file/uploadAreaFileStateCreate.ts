import type { JSX } from "solid-js"
import type { AssignmentTarget } from "#src/assignment/model/assignmentTargetSchema.ts"
import type { FileModel } from "#src/file/model/FileModel.ts"
import { type UploadStatus, uploadStatus } from "#src/file/model_field/uploadStatus.ts"
import type { UploadAreaFileInfo } from "#src/file/ui/stats/UploadAreaFileInfo.ts"
import { uploadHandlerFile } from "#src/file/ui/upload_file/uploadHandlerFile.tsx"
import type { SignalObject } from "#ui/utils/createSignalObject.ts"
import { generateId12 } from "#utils/ran/generateId12.js"

export function uploadAreaFileStateCreate(p: {
  id: () => string | undefined
  hasUploaded: () => boolean
  info: SignalObject<UploadAreaFileInfo | null>
  error?: SignalObject<string | null>
  handler?: JSX.ChangeEventHandlerUnion<HTMLInputElement, Event>
  resourceId?: string
  assignment?: AssignmentTarget | null
  onUploadSuccess?: (file: FileModel) => void
}) {
  const id = p.id() ?? generateId12()

  const handler = p.handler ?? createFileChangeHandler()

  function createFileChangeHandler(): JSX.ChangeEventHandlerUnion<HTMLInputElement, Event> {
    return async (e) => {
      const files = e.currentTarget.files
      if (!files?.[0]) return

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

  function getCurrentStatus(): UploadStatus {
    return uploadStatusGet(p.error?.get() ?? null, p.info.get(), p.hasUploaded())
  }

  return { id, handler, getCurrentStatus }
}

function uploadStatusGet(error: string | null, info: UploadAreaFileInfo | null, hasUploaded: boolean): UploadStatus {
  if (error) return uploadStatus.error
  if (info) return uploadStatus.uploading
  if (hasUploaded) return uploadStatus.uploaded
  return uploadStatus.empty
}
