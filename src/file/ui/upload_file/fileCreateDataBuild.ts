import type { AssignmentTarget } from "#src/assignment/model/assignmentTargetSchema.ts"
import type { FileDataModel } from "#src/file/model/FileModel.ts"
import { baseUrlJoinPath } from "#src/utils/url/baseUrlJoinPath.ts"

export interface FileCreateDataBuildParams {
  fileId: string
  displayName: string
  contentType: string
  fileSize: number
  baseUrlR2: string
  imageWidth?: number
  imageHeight?: number
  resourceId?: string
  assignment?: AssignmentTarget | null
}

export function fileCreateDataBuild(params: FileCreateDataBuildParams): FileDataModel {
  const data: FileDataModel = {
    fileId: params.fileId,
    displayName: params.displayName,
    contentType: params.contentType,
    fileSize: params.fileSize,
    url: baseUrlJoinPath(params.baseUrlR2, params.fileId),
  }

  if (params.imageWidth !== undefined) {
    data.imageWidth = params.imageWidth
  }
  if (params.imageHeight !== undefined) {
    data.imageHeight = params.imageHeight
  }
  if (params.resourceId) {
    data.resourceId = params.resourceId
  }
  if (params.assignment) {
    data.assignment = params.assignment
  }

  return data
}
