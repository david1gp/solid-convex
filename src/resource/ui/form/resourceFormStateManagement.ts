import { mdiAlertCircle } from "@adaptive-ds/mdi/mdiAlertCircle.js"
import { mdiPenOff } from "@adaptive-ds/mdi/mdiPenOff.js"
import { debounce, type Scheduled } from "@solid-primitives/scheduled"
import * as a from "valibot"
import { type Language, language } from "#src/app/i18n/language.ts"
import { ttc } from "#src/app/i18n/ttc.ts"
import { imageUrlExample } from "#src/app/url/imageUrlExample.ts"
import type { AssignmentTarget } from "#src/assignment/model/assignmentTargetSchema.ts"
import type { FileModel } from "#src/file/model/FileModel.ts"
import type { ResourceFilesModel } from "#src/resource/model/ResourceFilesModel.ts"
import type { ResourceModel } from "#src/resource/model/ResourceModel.ts"
import { resourceIdGenerateFromName } from "#src/resource/model/resourceIdGenerateFromName.ts"
import { type ResourceType, resourceType } from "#src/resource/model_field/resourceType.ts"
import { type Visibility, visibility } from "#src/resource/model_field/visibility.ts"
import { type ResourceFormErrorState, resourceCreateErrorState } from "#src/resource/ui/form/ResourceFormErrorState.ts"
import { type ResourceFormState, resourceFormStateCreate } from "#src/resource/ui/form/ResourceFormState.ts"
import { type ResourceFormActions, resourceFormCreateActions } from "#src/resource/ui/form/resourceFormCreateActions.ts"
import {
  type ResourceFormField,
  resourceFormConfig,
  resourceFormField,
} from "#src/resource/ui/form/resourceFormField.ts"
import { resourceFormLocalStorage } from "#src/resource/ui/form/resourceFormLocalStorage.ts"
import { debounceMs } from "#src/utils/ui/debounceMs.ts"
import { type FormMode, formMode } from "#ui/input/form/formMode.ts"
import { toastAdd } from "#ui/interactive/toast/toastAdd.ts"
import { createSignalObject, type SignalObject } from "#ui/utils/createSignalObject.ts"

export type ResourceFormData = {
  resourceId: string
  assignment?: AssignmentTarget | undefined
  // General
  name: string
  description: string
  type: ResourceType
  // Display
  visibility: Visibility
  image: string
  language: Language
  // Files
  fileIds: string[]
}

export type ResourceFormStateManagement = {
  mode: FormMode
  isSubmitting: SignalObject<boolean>
  serverState: SignalObject<ResourceFilesModel>
  state: ResourceFormState
  errors: ResourceFormErrorState
  hasErrors: () => boolean
  fillTestData: () => void
  loadData: (data: ResourceModel, files?: FileModel[]) => void
  validateOnChange: (field: ResourceFormField) => Scheduled<[value: string]>
  handleSubmit: (e: SubmitEvent) => Promise<void>
  debouncedSave: () => void
}

function createResourceFormData(): ResourceFormData {
  return {
    resourceId: "",
    // General
    name: "",
    description: "",
    type: resourceType.strategy,
    // Display
    visibility: visibility.public,
    image: "",
    language: language.en,
    // Files
    fileIds: [],
  }
}

function createEmptyResource(): ResourceModel {
  const now = new Date()
  const iso = now.toISOString()
  return {
    ...createResourceFormData(),
    createdAt: iso,
    updatedAt: iso,
  }
}

function createEmptyResourceFiles(): ResourceFilesModel {
  return {
    resource: createEmptyResource(),
    files: [],
  }
}

export function resourceFormStateManagement(
  mode: FormMode,
  resourceId?: string,
  resource?: ResourceModel,
  files?: FileModel[],
  options?: { actions: ResourceFormActions; persist: false },
): ResourceFormStateManagement {
  const serverState = createSignalObject(createEmptyResourceFiles())
  const isSubmitting = createSignalObject(false)
  const state = resourceFormStateCreate()
  const actions: ResourceFormActions = options ? options.actions : resourceFormCreateActions(mode, resourceId)

  if (mode === formMode.add) {
    if (!options) {
      const loadedData = resourceFormLocalStorage.loadFromLocalStorage()
      if (loadedData.success) {
        loadData(loadedData.data.resource, serverState, state, loadedData.data.files, mode)
      }
    }
  } else if (resource) {
    loadData(resource, serverState, state, files, mode)
  }

  const errors = resourceCreateErrorState()

  const debouncedSave = options ? () => {} : resourceFormLocalStorage.createDebounceSave(mode, state)

  const originalAssignmentSet = state.assignment.set
  state.assignment.set = (value) => {
    originalAssignmentSet(value)
    debouncedSave()
  }

  return {
    mode,
    isSubmitting,
    serverState,
    state,
    loadData: (data: ResourceModel, files?: FileModel[]) => loadData(data, serverState, state, files, mode),
    errors,
    hasErrors: () => hasErrors(errors),
    fillTestData: () => fillTestData(state, errors),
    validateOnChange: (field: ResourceFormField) => {
      debouncedSave()
      return validateOnChange(field, state, serverState, errors)
    },
    handleSubmit: (e: SubmitEvent) => handleSubmit(e, isSubmitting, serverState, state, errors, actions),
    debouncedSave,
  }
}

function loadData(
  data: ResourceModel,
  serverState: SignalObject<ResourceFilesModel>,
  state: ResourceFormState,
  files?: FileModel[],
  mode?: FormMode,
): void {
  const resourceFiles: ResourceFilesModel = {
    resource: data,
    files: files ?? [],
  }
  serverState.set(resourceFiles)
  state.resourceId.set(data.resourceId)
  state.assignment.set(data.assignment ?? undefined)
  // General
  state.name.set(data.name ?? "")
  state.description.set(data.description ?? "")
  state.type.set(data.type ?? resourceType.strategy)
  // Display
  state.visibility.set(data.visibility ?? visibility.member)
  state.image.set(data.image ?? "")
  state.language.set(data.language ?? language.en)
  // Files - Set files if provided, otherwise initialize with empty array
  state.fileIds.set(files ?? [])
  // Save to localStorage for add mode
  if (mode === formMode.add) {
    resourceFormLocalStorage.saveToLocalStorage(resourceFiles)
  }
}

function hasErrors(errors: ResourceFormErrorState) {
  return (
    !!errors.resourceId.get() ||
    !!errors.name.get() ||
    !!errors.description.get() ||
    !!errors.type.get() ||
    !!errors.language.get() ||
    !!errors.visibility.get() ||
    !!errors.image.get() ||
    !!errors.fileIds.get()
  )
}

function fillTestData(state: ResourceFormState, errors: ResourceFormErrorState) {
  const name = "Test Resource"
  state.name.set(name)
  const resourceId = resourceIdGenerateFromName(name)
  state.resourceId.set(resourceId)
  // General
  state.description.set("Test resource description")
  state.type.set(resourceType.report)
  // Display
  state.visibility.set(visibility.public)
  state.image.set(imageUrlExample)
  state.language.set(language.en)
  // Files
  state.fileIds.set([])

  for (const field of Object.values(resourceFormField)) {
    if (field === "files") continue
    updateFieldError(field, state[field as keyof typeof state].get(), errors)
  }
}

function validateOnChange(
  field: ResourceFormField,
  state: ResourceFormState,
  serverState: SignalObject<ResourceFilesModel>,
  errors: ResourceFormErrorState,
) {
  return debounce((value: string) => {
    if (field === resourceFormField.files) return
    autoFillResourceId(field, value, state, serverState)
    updateFieldError(field, value, errors)
  }, debounceMs)
}

function autoFillResourceId(
  field: ResourceFormField,
  value: string,
  state: ResourceFormState,
  serverState: SignalObject<ResourceFilesModel>,
) {
  if (field !== resourceFormField.name) return
  const ss = serverState.get()
  if (ss.resource.resourceId) return
  const resourceId = resourceIdGenerateFromName(value)
  state.resourceId.set(resourceId)
}

function updateFieldError(field: ResourceFormField, value: any, errors: ResourceFormErrorState) {
  if (field === resourceFormField.files) return
  const result = validateFieldResult(field, value)
  const errorSig = errors[field as keyof typeof errors]
  if (result.success) {
    errorSig.set("")
  } else {
    errorSig.set(result.issues[0].message)
  }
}

function validateFieldResult(field: ResourceFormField, value: any) {
  const schema = resourceFormConfig[field].schema
  return a.safeParse(schema!, value)
}

//
// Actions
//

async function handleSubmit(
  e: SubmitEvent,
  isSubmitting: SignalObject<boolean>,
  serverState: SignalObject<ResourceFilesModel>,
  state: ResourceFormState,
  errors: ResourceFormErrorState,
  actions: ResourceFormActions,
): Promise<void> {
  e.preventDefault()

  if (isSubmitting.get()) {
    const title = ttc("Submission in progress, please wait")
    console.info(title)
    return
  }

  const name = state.name.get()
  let resourceId = state.resourceId.get()
  if (!resourceId) {
    resourceId = resourceIdGenerateFromName(name)
  }
  // General
  const description = state.description.get()
  const type = state.type.get()
  // Display
  const visibility = state.visibility.get()
  const image = state.image.get()
  const language = state.language.get()
  // Files
  const files = state.fileIds.get()

  //
  // Validation
  //

  const resourceIdResult = validateFieldResult(resourceFormField.resourceId, resourceId)
  const nameResult = validateFieldResult(resourceFormField.name, name)
  const descriptionResult = validateFieldResult(resourceFormField.description, description)
  const typeResult = validateFieldResult(resourceFormField.type, type)
  // Display
  const visibilityResult = validateFieldResult(resourceFormField.visibility, visibility)
  const imageResult = validateFieldResult(resourceFormField.image, image)
  const languageResult = validateFieldResult(resourceFormField.language, language)
  const fileIdsResult = validateFieldResult(resourceFormField.files, files)

  errors.resourceId.set(resourceIdResult.success ? "" : resourceIdResult.issues[0].message)
  errors.name.set(nameResult.success ? "" : nameResult.issues[0].message)
  errors.description.set(descriptionResult.success ? "" : descriptionResult.issues[0].message)
  errors.type.set(typeResult.success ? "" : typeResult.issues[0].message)
  // Display
  errors.visibility.set(visibilityResult.success ? "" : visibilityResult.issues[0].message)
  errors.image.set(imageResult.success ? "" : imageResult.issues[0].message)
  errors.language.set(languageResult.success ? "" : languageResult.issues[0].message)
  errors.fileIds.set(fileIdsResult.success ? "" : fileIdsResult.issues[0].message)

  const isSuccess =
    resourceIdResult.success &&
    nameResult.success &&
    descriptionResult.success &&
    typeResult.success &&
    // Display
    visibilityResult.success &&
    imageResult.success &&
    languageResult.success &&
    fileIdsResult.success

  if (!isSuccess) {
    if (!resourceIdResult.success) {
      toastAdd({
        title: resourceIdResult.issues[0].message,
        icon: mdiAlertCircle,
        id: "resourceId",
      })
    }
    if (!nameResult.success) {
      toastAdd({
        title: nameResult.issues[0].message,
        icon: mdiAlertCircle,
        id: "name",
      })
    }
    return
  }

  isSubmitting.set(true)

  if (actions.create) {
    const fileIds = files.map((f) => f.fileId)
    const data: ResourceFormData = {
      resourceId,
      assignment: state.assignment.get(),
      name,
      description,
      type,
      language,
      // Display
      visibility,
      image,
      // Files
      fileIds,
    }
    await actions.create(data)
  }

  if (actions.edit) {
    const data: Partial<ResourceFormData> = {}
    const ss = serverState.get()
    if (resourceId !== ss.resource.resourceId) data.resourceId = resourceId

    const currentAssignment = state.assignment.get()
    const origAssignment = ss.resource.assignment
    const currentJson = JSON.stringify(currentAssignment ?? null)
    const origJson = JSON.stringify(origAssignment ?? null)
    if (currentJson !== origJson) {
      data.assignment = currentAssignment ?? (null as any)
    }

    if (name !== ss.resource.name) data.name = name
    if (description !== ss.resource.description) data.description = description
    if (type !== ss.resource.type) data.type = type
    // Display
    if (visibility !== ss.resource.visibility) data.visibility = visibility
    if (image !== ss.resource.image) data.image = image
    if (language !== ss.resource.language) data.language = language

    // Files - Compare current files with original files
    const currentFileIds = files.map((f) => f.fileId)
    const originalFileIds = ss.files.map((f) => f.fileId)

    // Check if files have changed (order doesn't matter)
    const filesChanged =
      currentFileIds.length !== originalFileIds.length || !currentFileIds.every((id) => originalFileIds.includes(id))

    if (filesChanged) {
      data.fileIds = currentFileIds
    }

    if (Object.keys(data).length === 0) {
      const icon = mdiPenOff
      const title = ttc("No changes")
      const id = "form"
      toastAdd({ icon, title, id })
      isSubmitting.set(false)
      return
    }

    await actions.edit(data)
  }

  if (actions.delete) {
    await actions.delete()
  }

  isSubmitting.set(false)
}
