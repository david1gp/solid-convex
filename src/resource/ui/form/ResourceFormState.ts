import { type Language, language } from "#src/app/i18n/language.ts"
import type { AssignmentTarget } from "#src/assignment/model/assignmentTargetSchema.ts"
import type { FileModel } from "#src/file/model/FileModel.ts"
import { type ResourceType, resourceType } from "#src/resource/model_field/resourceType.ts"
import { type Visibility, visibility } from "#src/resource/model_field/visibility.ts"
import { createSignalObject, type SignalObject } from "#ui/utils/createSignalObject.ts"

export type ResourceFormState = {
  resourceId: SignalObject<string>
  // Hierarchy assignment
  assignment: SignalObject<AssignmentTarget | undefined>
  // General
  name: SignalObject<string>
  description: SignalObject<string>
  type: SignalObject<ResourceType>
  // Display
  visibility: SignalObject<Visibility>
  image: SignalObject<string>
  language: SignalObject<Language>
  // Files
  fileIds: SignalObject<FileModel[]>
}

export function resourceFormStateCreate(): ResourceFormState {
  return {
    resourceId: createSignalObject(""),
    // Hierarchy assignment
    assignment: createSignalObject<AssignmentTarget | undefined>(undefined),
    // General
    name: createSignalObject(""),
    description: createSignalObject(""),
    type: createSignalObject<ResourceType>(resourceType.strategy),
    // Display
    visibility: createSignalObject<Visibility>(visibility.public),
    image: createSignalObject(""),
    language: createSignalObject<Language>(language.en),
    // Files
    fileIds: createSignalObject<FileModel[]>([]),
  }
}
