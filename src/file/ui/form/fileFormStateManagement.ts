import { mdiAlertCircle } from "@adaptive-ds/mdi/mdiAlertCircle.js"
import { mdiPenOff } from "@adaptive-ds/mdi/mdiPenOff.js"
import { debounce, type Scheduled } from "@solid-primitives/scheduled"
import * as a from "valibot"
import { api } from "#convex/_generated/api.js"
import type { Result } from "#result"
import { type Language, type LanguageOrNone, language, languageOrNone } from "#src/app/i18n/language.ts"
import { ttc } from "#src/app/i18n/ttc.ts"
import type { AssignmentTarget } from "#src/assignment/model/assignmentTargetSchema.ts"
import { userTokenGet } from "#src/auth/ui/signals/userSessionSignal.ts"
import type { FileModel } from "#src/file/model/FileModel.ts"
import { type FileFormField, fileFormConfig, fileFormField } from "#src/file/ui/form/fileFormField.ts"
import { urlResourceList, urlResourceView } from "#src/resource/url/urlResource.ts"
import { mutationCreate } from "#src/utils/convex_client/mutationCreate.ts"
import { navigateTo } from "#src/utils/router/navigateTo.ts"
import { debounceMs } from "#src/utils/ui/debounceMs.ts"
import type { HasToken } from "#src/utils/ui/HasToken.ts"
import { type FormMode, formMode } from "#ui/input/form/formMode.ts"
import { toastAdd } from "#ui/interactive/toast/toastAdd.ts"
import { toastVariant } from "#ui/interactive/toast/toastVariant.ts"
import { createSignalObject, type SignalObject } from "#ui/utils/createSignalObject.ts"

export type FileFormData = {
  displayName: string
  language?: LanguageOrNone
  assignment?: AssignmentTarget | undefined
}

export type FileFormState = {
  displayName: SignalObject<string>
  language: SignalObject<string>
  assignment: SignalObject<AssignmentTarget | undefined>
}

export type FileFormErrorState = {
  displayName: SignalObject<string>
  language: SignalObject<string>
}

function fileCreateState(): FileFormState {
  return {
    displayName: createSignalObject(""),
    language: createSignalObject<string>(""),
    assignment: createSignalObject<AssignmentTarget | undefined>(undefined),
  }
}

export type FormModeEditOrDelete = typeof formMode.edit | typeof formMode.remove

export type FileFormStateManagement = {
  mode: FormModeEditOrDelete
  isSubmitting: SignalObject<boolean>
  serverState: SignalObject<FileModel>
  state: FileFormState
  errors: FileFormErrorState
  actions: FileFormActions
  hasErrors: () => boolean
  fillTestData: () => void
  loadData: (data: FileModel) => void
  validateOnChange: (field: FileFormField) => Scheduled<[value: string | number | undefined]>
  handleSubmit: (e: SubmitEvent) => Promise<void>
}

function createFileFormData(): FileFormData {
  return {
    displayName: "",
    language: language.en,
  }
}

function createEmptyFile(): FileModel {
  const now = new Date()
  const iso = now.toISOString()
  return {
    ...createFileFormData(),
    fileId: "",
    resourceId: "",
    url: "",
    fileSize: 0,
    language: language.en,
    contentType: "",
    createdAt: iso,
    updatedAt: iso,
  }
}

export function fileFormStateManagement(mode: FormModeEditOrDelete, file: FileModel): FileFormStateManagement {
  const actions: FileFormActions = createActions(mode, file)
  const serverState = createSignalObject(createEmptyFile())
  const isSubmitting = createSignalObject(false)
  const state = fileCreateState()
  if (file) {
    loadData(file, serverState, state)
  }
  const errors = fileCreateState()
  return {
    mode,
    isSubmitting,
    serverState,
    state,
    errors,
    actions,
    hasErrors: () => hasErrors(errors),
    fillTestData: () => fillTestData(state, errors),
    loadData: (data: FileModel) => loadData(data, serverState, state),
    validateOnChange: (field: FileFormField) => validateOnChange(field, state, errors),
    handleSubmit: (e: SubmitEvent) => handleSubmit(e, isSubmitting, serverState, state, errors, actions),
  }
}

function loadData(data: FileModel, serverState: SignalObject<FileModel>, state: FileFormState): void {
  serverState.set(data)
  state.displayName.set(data.displayName ?? "")
  state.language.set(data.language ?? language.en)
  state.assignment.set(data.assignment ?? undefined)
}

function hasErrors(errors: FileFormErrorState) {
  return !!(errors.displayName.get() || errors.language.get())
}

function fillTestData(state: FileFormState, errors: FileFormErrorState) {
  state.displayName.set("test-file.pdf")
  state.language.set(language.en)
  for (const field of Object.values(fileFormField)) {
    const val = field === fileFormField.displayName ? state.displayName.get() : state.language.get()
    updateFieldError(field, val, errors)
  }
}

function validateOnChange(field: FileFormField, state: FileFormState, errors: FileFormErrorState) {
  return debounce((value: string | number | undefined) => {
    updateFieldError(field, value, errors)
  }, debounceMs)
}

function updateFieldError(field: FileFormField, value: string | number | undefined, errors: FileFormErrorState) {
  const result = validateFieldResult(field, value)
  const errorSig = errors[field as keyof typeof errors]
  if (result.success) {
    errorSig.set("")
  } else {
    errorSig.set(result.issues[0].message)
  }
}

function validateFieldResult(field: FileFormField, value: string | number | undefined) {
  const schema = fileFormConfig[field].schema
  return a.safeParse(schema!, value)
}

//
// Actions
//

export type FileFormActions = {
  edit?: FileFormEditFn
  delete?: FileFormDeleteFn
}

async function handleSubmit(
  e: SubmitEvent,
  isSubmitting: SignalObject<boolean>,
  serverState: SignalObject<FileModel>,
  state: FileFormState,
  errors: FileFormErrorState,
  actions: FileFormActions,
): Promise<void> {
  e.preventDefault()

  if (isSubmitting.get()) {
    const title = ttc("Submission in progress, please wait")
    console.info(title)
    return
  }

  const displayName = state.displayName.get()
  const language = state.language.get()

  const displayNameResult = validateFieldResult(fileFormField.displayName, displayName)
  const languageResult = validateFieldResult(fileFormField.language, language)

  errors.displayName.set(displayNameResult.success ? "" : displayNameResult.issues[0].message)
  errors.language.set(languageResult.success ? "" : languageResult.issues[0].message)

  const isSuccess = displayNameResult.success && languageResult.success

  if (!isSuccess) {
    if (!displayNameResult.success) {
      toastAdd({
        title: displayNameResult.issues[0].message,
        icon: mdiAlertCircle,
        id: "fileId",
      })
    }
    if (!languageResult.success) {
      toastAdd({
        title: languageResult.issues[0].message,
        icon: mdiAlertCircle,
        id: "language",
      })
    }
    return
  }

  isSubmitting.set(true)

  if (actions.edit) {
    const data: Partial<FileFormData> = {}
    const ss = serverState.get()
    if (displayName !== ss.fileId) {
      data.displayName = displayName
    }
    if (language !== ss.language) {
      data.language = language === "" ? languageOrNone.none : (language as LanguageOrNone)
    }

    const currentAssignment = state.assignment.get()
    const origAssignment = ss.assignment
    const currentJson = JSON.stringify(currentAssignment ?? null)
    const origJson = JSON.stringify(origAssignment ?? null)
    if (currentJson !== origJson) {
      data.assignment = currentAssignment ?? (null as any)
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

export type FileFormEditFn = (state: Partial<FileFormData>) => Promise<void>
export type FileFormDeleteFn = () => Promise<void>

function createActions(mode: FormMode, file: FileModel): FileFormActions {
  const actions: FileFormActions = {}
  if (mode === formMode.edit) {
    const editMutation = mutationCreate(api.file.fileEditMutation)
    actions.edit = async (data) => editAction(data, file, mode, editMutation)
  }
  if (mode === formMode.remove) {
    const deleteMutation = mutationCreate(api.file.fileDeleteMutation)
    actions.delete = async () => removeAction(file, deleteMutation)
  }
  return actions
}

interface FileEditMutationProps extends HasToken {
  fileId: string
  displayName?: string
  language?: Language
  assignment?: AssignmentTarget | null
}

interface FileRemoveMutationProps extends HasToken {
  fileId: string
}

async function editAction(
  data: Partial<FileFormData>,
  file: FileModel,
  mode: FormMode,
  editMutation: (data: FileEditMutationProps) => Promise<Result<null>>,
) {
  if (!file) {
    toastAdd({ title: "!file", variant: toastVariant.error })
    return
  }
  const editData: FileEditMutationProps = {
    fileId: file.fileId,
    // resourceId: file.resourceId,
    token: userTokenGet(),
    displayName: data.displayName,
  }
  if (data.language) {
    editData.language = data.language as Language
  }
  if (data.assignment !== undefined) {
    editData.assignment = data.assignment
  }
  const editResult = await editMutation(editData)
  if (!editResult.success) {
    console.error(editResult)
    toastAdd({ title: editResult.errorMessage, variant: toastVariant.error })
    return
  }
  const url = getReturnPath(mode, file.resourceId)
  navigateTo(url)
}

async function removeAction(file: FileModel, deleteMutation: (data: FileRemoveMutationProps) => Promise<Result<null>>) {
  if (!file) {
    toastAdd({ title: "!file", variant: toastVariant.error })
    return
  }
  const deleteResult = await deleteMutation({
    token: userTokenGet(),
    fileId: file.fileId,
  })
  if (!deleteResult.success) {
    console.error(deleteResult)
    toastAdd({ title: deleteResult.errorMessage, variant: toastVariant.error })
    return
  }
  const url = getReturnPath(formMode.remove, file.resourceId)
  navigateTo(url)
}

function getReturnPath(mode: FormMode, resourceId?: string) {
  if (resourceId) {
    return urlResourceView(resourceId)
  }
  return urlResourceList()
}
