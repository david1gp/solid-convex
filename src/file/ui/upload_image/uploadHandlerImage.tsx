import { posthog } from "posthog-js"
import { createResultError, type PromiseResult } from "#result"
import { ttc } from "#src/app/i18n/ttc.ts"
import type { AssignmentTarget } from "#src/assignment/model/assignmentTargetSchema.ts"
import type { FileModel } from "#src/file/model/FileModel.ts"
import { fileInformationGet } from "#src/file/ui/stats/fileInformationGet.ts"
import type { UploadAreaFileInfo } from "#src/file/ui/stats/UploadAreaFileInfo.ts"
import { uploadHandlerFilePure } from "#src/file/ui/upload_file/uploadHandlerFile.tsx"
import type { MayHaveResourceId } from "#src/resource/model/MayHaveResourceId.ts"
import { toastAdd } from "#ui/interactive/toast/toastAdd.ts"
import { toastVariant } from "#ui/interactive/toast/toastVariant.ts"
import type { SignalObject } from "#ui/utils/createSignalObject.ts"

export interface ImageUploadHandlerProps extends MayHaveResourceId {
  file: File
  uploadInfo: SignalObject<UploadAreaFileInfo | null>
  uploadError?: SignalObject<string | null>
  onUploadSuccess?: (file: FileModel) => void
  assignment?: AssignmentTarget | null
}

export async function uploadHandlerImage(p: ImageUploadHandlerProps): PromiseResult<FileModel> {
  const op = "uploadHandlerImage"

  await fileInformationGet(p.file, p.uploadInfo)

  const info = p.uploadInfo.get()

  const uploadResult = await uploadHandlerImagePure(p.file, info, p.resourceId, p.assignment)
  posthog.capture(op, uploadResult)
  if (!uploadResult.success) {
    const errorMessage = ttc("Failed to upload image")
    console.error(uploadResult)
    p.uploadError?.set(uploadResult.errorMessage)
    toastAdd({
      title: errorMessage,
      description: uploadResult.errorMessage,
      variant: toastVariant.error,
    })
    return uploadResult
  }
  const uploadedFile = uploadResult.data

  const successMessage = ttc("Image uploaded successfully")
  console.log(op, successMessage, uploadedFile)
  toastAdd({
    title: successMessage,
    variant: toastVariant.success,
  })

  p.uploadInfo.set(null)
  p.onUploadSuccess?.(uploadedFile)
  return uploadResult
}

export async function uploadHandlerImagePure(
  file: File,
  info: UploadAreaFileInfo | null,
  resourceId?: string,
  assignment?: AssignmentTarget | null,
): PromiseResult<FileModel> {
  const op = "uploadHandlerImagePure"

  if (!info) {
    const errorMessage = ttc("Missing file information")
    return createResultError(op, errorMessage)
  }

  if (!info.imageWidth || !info.imageHeight) {
    const errorMessage = ttc("Invalid image file or missing dimensions")
    return createResultError(op, errorMessage)
  }

  return uploadHandlerFilePure(file, info, resourceId, assignment)
}
