import type { Accessor } from "solid-js"
import type { FileModel } from "#src/file/model/FileModel.ts"
import type { UploadAreaFileInfo } from "#src/file/ui/stats/UploadAreaFileInfo.ts"
import type { ResourceFormFilesState } from "#src/resource/ui/form/ResourceFormFilesState.ts"
import { resourceFormField } from "#src/resource/ui/form/resourceFormField.ts"
import type { ResourceFormStateManagement } from "#src/resource/ui/form/resourceFormStateManagement.ts"
import { formMode } from "#ui/input/form/formMode.ts"
import { createSignalObject } from "#ui/utils/createSignalObject.ts"

interface ResourceFormFilesStateProps {
  sm: Accessor<ResourceFormStateManagement>
}

export function resourceFormFilesStateCreate(
  input: ResourceFormFilesStateProps | Accessor<ResourceFormStateManagement>,
): ResourceFormFilesState {
  const getSm = typeof input === "function" ? input : input.sm
  const uploadInfo = createSignalObject<UploadAreaFileInfo | null>(null)
  const uploadError = createSignalObject<string | null>(null)

  const hasUploaded = () => Boolean(uploadInfo.get())
  const files = () => getSm().state.fileIds.get()

  function fileRemove(fileId: string) {
    const sm = getSm()
    const currentFiles = sm.state.fileIds.get()
    const updatedFiles = currentFiles.filter((f) => f.fileId !== fileId)
    sm.state.fileIds.set(updatedFiles)
    sm.validateOnChange(resourceFormField.files)(updatedFiles.join(","))
    sm.debouncedSave()
  }

  function fileUploadSuccess(file: FileModel) {
    const sm = getSm()
    const currentFiles = sm.state.fileIds.get()
    sm.state.fileIds.set([...currentFiles, file])
    sm.debouncedSave()
  }

  function persistedResourceId(): string | undefined {
    const sm = getSm()
    if (sm.mode !== formMode.edit) return undefined
    return sm.serverState.get().resource.resourceId || undefined
  }

  const assignment = () => getSm().state.assignment.get()
  const errorMessage = () => getSm().errors.fileIds.get()

  return {
    uploadInfo,
    uploadError,
    hasUploaded,
    files,
    getCurrentFiles: files,
    persistedResourceId,
    assignment,
    errorMessage,
    fileRemove,
    handleRemoveFile: fileRemove,
    fileUploadSuccess,
    handleUploadSuccess: fileUploadSuccess,
  }
}
