import { posthog } from "posthog-js"
import { createResult, createResultError, type PromiseResult } from "#result"
import { envBaseUrlR2Result } from "#src/app/env/public/envBaseUrlR2Result.ts"
import { ttc } from "#src/app/i18n/ttc.ts"
import type { AssignmentTarget } from "#src/assignment/model/assignmentTargetSchema.ts"
import { userSessionGet } from "#src/auth/ui/signals/userSessionSignal.ts"
import { fileCreateClientMutation } from "#src/file/api_client/fileCreateClientMutation.ts"
import type { FileModel } from "#src/file/model/FileModel.ts"
import { fileIdGenerate } from "#src/file/model_field/fileIdGenerate.ts"
import { fileInformationGet } from "#src/file/ui/stats/fileInformationGet.ts"
import type { UploadAreaFileInfo } from "#src/file/ui/stats/UploadAreaFileInfo.ts"
import { fileCreateDataBuild } from "#src/file/ui/upload_file/fileCreateDataBuild.ts"
import { apiR2FileCreate } from "#src/r2/api_client/apiR2FileCreate.ts"
import { apiR2GetUploadUrl } from "#src/r2/api_client/apiR2GetUploadUrl.ts"
import { apiR2UploadFileWithProgress } from "#src/r2/api_client/apiR2UploadFile.ts"
import type { MayHaveResourceId } from "#src/resource/model/MayHaveResourceId.ts"
import { toastAdd } from "#ui/interactive/toast/toastAdd.ts"
import { toastVariant } from "#ui/interactive/toast/toastVariant.ts"
import type { SignalObject } from "#ui/utils/createSignalObject.ts"

export interface FileUploadHandlerProps extends MayHaveResourceId {
  file: File
  uploadInfo: SignalObject<UploadAreaFileInfo | null>
  uploadError?: SignalObject<string | null>
  onUploadSuccess?: (file: FileModel) => void
  assignment?: AssignmentTarget | null
}

export async function uploadHandlerFile(p: FileUploadHandlerProps): PromiseResult<FileModel> {
  const op = "uploadHandlerFile"

  await fileInformationGet(p.file, p.uploadInfo)

  const info = p.uploadInfo.get()

  const uploadResult = await uploadHandlerFilePure(p.file, info, p.resourceId, p.assignment)
  posthog.capture(op, uploadResult)
  if (!uploadResult.success) {
    const errorMessage = ttc("Failed to upload file")
    console.error(errorMessage, uploadResult)
    p.uploadError?.set(uploadResult.errorMessage)
    toastAdd({
      title: errorMessage,
      description: uploadResult.errorMessage,
      variant: toastVariant.error,
    })
    return uploadResult
  }
  const uploadedFile = uploadResult.data

  const successMessage = ttc("File uploaded successfully")
  console.log(op, successMessage, uploadedFile)
  toastAdd({
    title: successMessage,
    variant: toastVariant.success,
  })

  p.uploadInfo.set(null)
  p.onUploadSuccess?.(uploadedFile)
  return uploadResult
}

export async function uploadHandlerFilePure(
  file: File,
  info: UploadAreaFileInfo | null,
  resourceId?: string,
  assignment?: AssignmentTarget | null,
): PromiseResult<FileModel> {
  const op = "uploadHandlerFilePure"

  const maxSize = 500 * 1024 * 1024
  if (file.size >= maxSize) {
    const errorMessage = ttc("File size exceeds 500 MB limit")
    return createResultError(op, errorMessage)
  }

  if (!info) {
    const errorMessage = ttc("Failed to get file information")
    return createResultError(op, errorMessage)
  }

  const session = userSessionGet()
  if (!session) {
    const errorMessage = ttc("No user session found")
    return createResultError(op, errorMessage)
  }
  const token = session.token

  const baseUrlR2Result = envBaseUrlR2Result()
  if (!baseUrlR2Result.success) {
    console.error(baseUrlR2Result)
    return createResultError(op, baseUrlR2Result.errorMessage)
  }
  const baseUrlR2 = baseUrlR2Result.data

  const fileId = fileIdGenerate(info.displayName)

  const urlResult = await apiR2GetUploadUrl(token, fileId)
  if (!urlResult.success) {
    console.error(urlResult)
    return createResultError(op, urlResult.errorMessage)
  }
  const url = urlResult.data

  const uploadResult = await apiR2UploadFileWithProgress(url, file, () => {})
  if (!uploadResult.success) {
    return createResultError(op, uploadResult.errorMessage)
  }

  const data = fileCreateDataBuild({
    fileId,
    displayName: info.displayName,
    contentType: info.contentType,
    fileSize: info.fileSize,
    baseUrlR2,
    imageWidth: info.imageWidth,
    imageHeight: info.imageHeight,
    resourceId,
    assignment,
  })

  // Prefer existing Convex mutation for signed-in metadata create; fallback to HTTP
  const mutationResult = await fileCreateClientMutation(data)
  if (!mutationResult.success) {
    const fileCreateResult = await apiR2FileCreate(data)
    if (!fileCreateResult.success) {
      return createResultError(op, fileCreateResult.errorMessage)
    }
  }

  const now = new Date().toISOString()
  const fileModel: FileModel = {
    ...data,
    createdAt: now,
    updatedAt: now,
  }

  return createResult(fileModel)
}
