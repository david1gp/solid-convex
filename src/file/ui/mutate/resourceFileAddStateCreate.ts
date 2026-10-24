import type { AssignmentTarget } from "#src/assignment/model/assignmentTargetSchema.ts"
import type { UploadAreaFileInfo } from "#src/file/ui/stats/UploadAreaFileInfo.ts"
import { createSignalObject } from "#ui/utils/createSignalObject.ts"

export function resourceFileAddStateCreate() {
  const info = createSignalObject<UploadAreaFileInfo | null>(null)
  const uploaded = createSignalObject<string | null>(null)
  const error = createSignalObject<string | null>(null)
  const assignment = createSignalObject<AssignmentTarget | undefined>(undefined)

  function hasUploaded() {
    return !!uploaded.get()
  }

  function markUploaded(url: string) {
    uploaded.set(url)
  }

  return { info, uploaded, error, assignment, hasUploaded, markUploaded }
}
