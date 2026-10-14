import { mdiAlertCircle } from "@adaptive-ds/mdi/mdiAlertCircle.js"
import { mdiPenOff } from "@adaptive-ds/mdi/mdiPenOff.js"
import { debounce, type Scheduled } from "@solid-primitives/scheduled"
import * as a from "valibot"
import { api } from "#convex/_generated/api.js"
import type { Result } from "#result"
import { ttc } from "#src/app/i18n/ttc.ts"
import { imageUrlExample } from "#src/app/url/imageUrlExample.ts"
import { userTokenGet } from "#src/auth/ui/signals/userSessionSignal.ts"
import type { IdOrg } from "#src/org/org_convex/IdOrg.ts"
import { type OrgModel, orgModelCreateEmpty } from "#src/org/org_model/OrgModel.ts"
import type { HasOrgHandle } from "#src/org/org_model_field/HasOrgHandle.ts"
import { orgHandleGenerate } from "#src/org/org_model_field/orgHandleSchema.ts"
import { type OrgFormField, orgFormConfig, orgFormField } from "#src/org/org_ui/form/orgFormField.ts"
import { orgFormLocalStorage } from "#src/org/org_ui/form/orgFormLocalStorage.ts"
import { urlOrgList, urlOrgView } from "#src/org/org_url/urlOrg.ts"
import { mutationCreate } from "#src/utils/convex_client/mutationCreate.ts"
import { navigateTo } from "#src/utils/router/navigateTo.ts"
import { debounceMs } from "#src/utils/ui/debounceMs.ts"
import type { HasToken } from "#src/utils/ui/HasToken.ts"
import { type FormMode, formMode } from "#ui/input/form/formMode.ts"
import { toastAdd } from "#ui/interactive/toast/toastAdd.ts"
import { toastVariant } from "#ui/interactive/toast/toastVariant.ts"
import { createSignalObject, type SignalObject } from "#ui/utils/createSignalObject.ts"

export type OrgFormData = {
  orgHandle: string
  // data
  name: string
  description: string
  url: string
  image: string
}

export type OrgFormState = {
  orgHandle: SignalObject<string>
  // data
  name: SignalObject<string>
  description: SignalObject<string>
  url: SignalObject<string>
  image: SignalObject<string>
}

export type OrgFormErrorState = {
  orgHandle: SignalObject<string>
  // data
  name: SignalObject<string>
  description: SignalObject<string>
  url: SignalObject<string>
  image: SignalObject<string>
}

function orgCreateState(): OrgFormState {
  return {
    orgHandle: createSignalObject(""),
    // date
    name: createSignalObject(""),
    description: createSignalObject(""),
    url: createSignalObject(""),
    image: createSignalObject(""),
  }
}

export type OrgFormStateManagement = {
  mode: FormMode
  isSubmitting: SignalObject<boolean>
  serverState: SignalObject<OrgModel>
  state: OrgFormState
  errors: OrgFormErrorState
  hasErrors: () => boolean
  fillTestData: () => void
  loadData: (data: OrgModel) => void
  validateOnChange: (field: OrgFormField) => Scheduled<[value: string]>
  handleSubmit: (e: SubmitEvent) => Promise<void>
  debouncedSave: () => void
}

export type OrgFormCreateFn = (state: OrgFormData) => Promise<void>
export type OrgFormEditFn = (state: Partial<OrgFormData>) => Promise<void>
export type OrgFormDeleteFn = () => Promise<void>

type OrgFormActions = {
  create?: OrgFormCreateFn
  edit?: OrgFormEditFn
  delete?: OrgFormDeleteFn
}

export function orgFormStateManagement(mode: FormMode, orgHandle?: string, org?: OrgModel): OrgFormStateManagement {
  const actions: OrgFormActions = createActions(mode, orgHandle)
  const serverState = createSignalObject(orgModelCreateEmpty())
  const isSubmitting = createSignalObject(false)
  const state = orgCreateState()

  if (mode === formMode.add) {
    orgFormLocalStorage.loadData((data) => loadData(data, serverState, state))
  } else if (org) {
    loadData(org, serverState, state)
  }

  const errors = orgCreateState()

  const debouncedSave = orgFormLocalStorage.createDebounceSave(mode, state)

  return {
    mode,
    isSubmitting,
    serverState,
    state,
    loadData: (data: OrgModel) => loadData(data, serverState, state),
    errors,
    hasErrors: () => hasErrors(errors),
    fillTestData: () => fillTestData(state, errors),
    validateOnChange: (field: OrgFormField) => {
      debouncedSave()
      return validateOnChange(field, state, serverState, errors)
    },
    handleSubmit: (e: SubmitEvent) => handleSubmit(e, isSubmitting, serverState, state, errors, actions),
    debouncedSave,
  }
}

function loadData(data: OrgModel, serverState: SignalObject<OrgModel>, state: OrgFormState): void {
  serverState.set(data)
  state.name.set(data.name ?? "")
  state.orgHandle.set(data.orgHandle)
  state.description.set(data.description ?? "")
  state.url.set(data.url ?? "")
  state.image.set(data.image ?? "")
}

function hasErrors(errors: OrgFormErrorState) {
  return (
    !!errors.name.get() ||
    !!errors.orgHandle.get() ||
    !!errors.description.get() ||
    !!errors.url.get() ||
    !!errors.image.get()
  )
}
function fillTestData(state: OrgFormState, errors: OrgFormErrorState) {
  const name = "Test Organization"
  state.name.set(name)
  const handle = orgHandleGenerate(name)
  state.orgHandle.set(handle)
  state.description.set("Test description")
  state.url.set("https://example.com")
  state.image.set(imageUrlExample)

  for (const field of Object.values(orgFormField)) {
    updateFieldError(field, state[field].get(), errors)
  }
}

function validateOnChange(
  field: OrgFormField,
  state: OrgFormState,
  serverState: SignalObject<OrgModel>,
  errors: OrgFormErrorState,
) {
  return debounce((value: string) => {
    autoFillHandle(field, value, state, serverState)
    updateFieldError(field, value, errors)
  }, debounceMs)
}

function autoFillHandle(field: OrgFormField, value: string, state: OrgFormState, serverState: SignalObject<OrgModel>) {
  if (field !== orgFormField.name) return
  const ss = serverState.get()
  if (ss.orgHandle) return
  const handle = orgHandleGenerate(value)
  state.orgHandle.set(handle)
}

function updateFieldError(field: OrgFormField, value: string, errors: OrgFormErrorState) {
  const result = validateFieldResult(field, value)
  const errorSig = errors[field as keyof typeof errors]
  if (result.success) {
    errorSig.set("")
  } else {
    errorSig.set(result.issues[0].message)
    console.log({ field, value, message: result.issues[0].message })
  }
}

function validateFieldResult(field: OrgFormField, value: string) {
  const schema = orgFormConfig[field].schema
  return a.safeParse(schema!, value)
}

//
// Actions
//

async function handleSubmit(
  e: SubmitEvent,
  isSubmitting: SignalObject<boolean>,
  serverState: SignalObject<OrgModel>,
  state: OrgFormState,
  errors: OrgFormErrorState,
  actions: OrgFormActions,
): Promise<void> {
  e.preventDefault()

  if (isSubmitting.get()) {
    const title = ttc("Submission in progress, please wait")
    console.info(title)
    return
  }

  const name = state.name.get()
  const orgHandle = state.orgHandle.get()
  const description = state.description.get()
  const url = state.url.get()
  const image = state.image.get()

  const nameResult = validateFieldResult(orgFormField.name, name)
  const handleResult = validateFieldResult(orgFormField.orgHandle, orgHandle)
  const descriptionResult = validateFieldResult(orgFormField.description, description)
  const urlResult = validateFieldResult(orgFormField.url, url)
  const imageResult = validateFieldResult(orgFormField.image, image)

  errors.name.set(nameResult.success ? "" : nameResult.issues[0].message)
  errors.orgHandle.set(handleResult.success ? "" : handleResult.issues[0].message)
  errors.description.set(descriptionResult.success ? "" : descriptionResult.issues[0].message)
  errors.url.set(urlResult.success ? "" : urlResult.issues[0].message)
  errors.image.set(imageResult.success ? "" : imageResult.issues[0].message)

  const isSuccess =
    nameResult.success && handleResult.success && descriptionResult.success && urlResult.success && imageResult.success

  if (!isSuccess) {
    if (!nameResult.success) {
      toastAdd({
        title: nameResult.issues[0].message,
        icon: mdiAlertCircle,
        id: orgFormField.name,
      })
    }
    if (!handleResult.success) {
      toastAdd({
        title: handleResult.issues[0].message,
        icon: mdiAlertCircle,
        id: orgFormField.orgHandle,
      })
    }
    if (!descriptionResult.success) {
      toastAdd({
        title: descriptionResult.issues[0].message,
        icon: mdiAlertCircle,
        id: orgFormField.description,
      })
    }
    if (!urlResult.success) {
      toastAdd({
        title: urlResult.issues[0].message,
        icon: mdiAlertCircle,
        id: orgFormField.url,
      })
    }
    if (!imageResult.success) {
      toastAdd({
        title: imageResult.issues[0].message,
        icon: mdiAlertCircle,
        id: orgFormField.image,
      })
    }
    return
  }

  isSubmitting.set(true)

  if (actions.create) {
    const data: OrgFormData = { name, orgHandle, description, url, image }
    await actions.create(data)
  }

  if (actions.edit) {
    const data: Partial<OrgFormData> = {}
    const ss = serverState.get()
    if (name !== ss.name) {
      data.name = name
    }
    if (description !== ss.description) {
      data.description = description
    }
    if (url !== ss.url) {
      data.url = url
    }
    if (image !== ss.image) {
      data.image = image
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

function createActions(mode: FormMode, orgHandle: string | undefined): OrgFormActions {
  const actions: OrgFormActions = {}
  if (mode === formMode.add) {
    const addMutation = mutationCreate(api.org.orgCreateMutation)
    actions.create = async (data) => createAction(data, addMutation)
  }
  if (mode === formMode.edit) {
    const editMutation = mutationCreate(api.org.orgEditMutation)
    actions.edit = async (data) => editAction(data, orgHandle, mode, editMutation)
  }
  if (mode === formMode.remove) {
    actions.delete = async () => {
      console.warn("Direct orgForm delete is disabled. Use hierarchy delete confirmation.")
    }
  }
  return actions
}

interface OrgCreateMutationProps extends OrgFormData, HasToken {}
interface OrgEditMutationProps extends Partial<Omit<OrgFormData, "orgHandle">>, HasOrgHandle, HasToken {}
interface OrgRemoveMutationProps extends HasOrgHandle, HasToken {}

async function createAction(
  data: OrgFormData,
  addMutation: (data: OrgCreateMutationProps) => Promise<Result<IdOrg>>,
): Promise<void> {
  const orgIdResult = await addMutation({
    token: userTokenGet(),
    // data
    ...data,
  })
  if (!orgIdResult.success) {
    console.error(orgIdResult)
    toastAdd({ title: orgIdResult.errorMessage, variant: toastVariant.error })
    return
  }
  orgFormLocalStorage.clearLocalStorage()
  // const orgId = await getMutationAdd(p.session, state)
  const url = urlOrgView(data.orgHandle)
  navigateTo(url)
}

async function editAction(
  data: Partial<OrgFormData>,
  orgHandle: string | undefined,
  mode: FormMode,
  editMutation: (data: OrgEditMutationProps) => Promise<Result<null>>,
) {
  if (!orgHandle) {
    toastAdd({ title: "!orgHandle", variant: toastVariant.error })
    return
  }
  const editResult = await editMutation({
    // auth
    token: userTokenGet(),
    // data
    ...data,
    // id
    orgHandle,
  })
  if (!editResult.success) {
    console.error(editResult)
    toastAdd({ title: editResult.errorMessage, variant: toastVariant.error })
    return
  }
  navigateTo(getReturnPath(mode, orgHandle))
}

async function removeAction(
  orgHandle: string | undefined,
  mode: FormMode,
  deleteMutation: (data: OrgRemoveMutationProps) => Promise<Result<null>>,
) {
  if (!orgHandle) {
    toastAdd({ title: "!orgHandle", variant: toastVariant.error })
    return
  }
  const deleteResult = await deleteMutation({
    // auth
    token: userTokenGet(),
    // id
    orgHandle,
  })
  if (!deleteResult.success) {
    console.error(deleteResult)
    toastAdd({ title: deleteResult.errorMessage, variant: toastVariant.error })
    return
  }
  navigateTo(getReturnPath(mode, orgHandle))
}

function getReturnPath(mode: FormMode, orgHandle?: string) {
  if (mode === formMode.edit && orgHandle) {
    return urlOrgView(orgHandle)
  }
  return urlOrgList()
}
