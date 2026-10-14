import type { Accessor } from "solid-js"
import type { AssignmentTarget } from "#src/assignment/model/assignmentTargetSchema.ts"
import type { FileModel } from "#src/file/model/FileModel.ts"
import type { UploadAreaFileInfo } from "#src/file/ui/stats/UploadAreaFileInfo.ts"
import type { SignalObject } from "#ui/utils/createSignalObject.ts"

export interface ResourceFormFilesState {
  uploadInfo: SignalObject<UploadAreaFileInfo | null>
  uploadError: SignalObject<string | null>
  hasUploaded: Accessor<boolean>
  files: Accessor<FileModel[]>
  getCurrentFiles: Accessor<FileModel[]>
  persistedResourceId: Accessor<string | undefined>
  assignment: Accessor<AssignmentTarget | undefined>
  errorMessage: Accessor<string | undefined>
  fileRemove: (fileId: string) => void
  handleRemoveFile: (fileId: string) => void
  fileUploadSuccess: (file: FileModel) => void
  handleUploadSuccess: (file: FileModel) => void
}
