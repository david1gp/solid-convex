import { mdiAlertCircle } from "@adaptive-ds/mdi/mdiAlertCircle.js"
import { debounce, type Scheduled } from "@solid-primitives/scheduled"
import * as a from "valibot"
import { api } from "#convex/_generated/api.js"
import type { Result } from "#result"
import { type Language, language } from "#src/app/i18n/language.ts"
import { languageSignalGet } from "#src/app/i18n/languageSignal.ts"
import { ttc } from "#src/app/i18n/ttc.ts"
import { userTokenGet } from "#src/auth/ui/signals/userSessionSignal.ts"
import type { OrgInvitationModel } from "#src/org/invitation_model/orgInvitationSchema.ts"
import {
  type OrgInvitationFormField,
  orgInvitationFormConfig,
  orgInvitationFormField,
} from "#src/org/invitation_ui/form/orgInvitationFormField.ts"
import {
  type OrgInvitationFormData,
  orgInvitationFormLocalStorage,
} from "#src/org/invitation_ui/form/orgInvitationFormLocalStorage.ts"
import { urlOrgInvitationList } from "#src/org/invitation_url/urlOrgInvitation.ts"
import { type OrgRole, orgRole } from "#src/org/org_model_field/orgRole.ts"
import { mutationCreate } from "#src/utils/convex_client/mutationCreate.ts"
import { navigateTo } from "#src/utils/router/navigateTo.ts"
import { debounceMs } from "#src/utils/ui/debounceMs.ts"
import type { HasToken } from "#src/utils/ui/HasToken.ts"
import { type FormMode, formMode } from "#ui/input/form/formMode.ts"
import { toastAdd } from "#ui/interactive/toast/toastAdd.ts"
import { toastVariant } from "#ui/interactive/toast/toastVariant.ts"
import { createSignalObject, type SignalObject } from "#ui/utils/createSignalObject.ts"

export type OrgInvitationFormState = {
  invitedName: SignalObject<string>
  invitedEmail: SignalObject<string>
  role: SignalObject<string>
  l: SignalObject<Language>
}

export type OrgInvitationFormErrorState = {
  invitedName: SignalObject<string>
  invitedEmail: SignalObject<string>
  role: SignalObject<string>
  l: SignalObject<string>
}

function createOrgInvitationFormState(): OrgInvitationFormState {
  return {
    invitedName: createSignalObject(""),
    invitedEmail: createSignalObject(""),
    role: createSignalObject<string>(orgRole.member),
    l: createSignalObject<Language>(languageSignalGet()),
  }
}

function createOrgInvitationErrorState(): OrgInvitationFormErrorState {
  return {
    invitedName: createSignalObject(""),
    invitedEmail: createSignalObject(""),
    role: createSignalObject(""),
    l: createSignalObject(""),
  }
}

export type OrgInvitationFormStateManagement = {
  mode: FormMode
  isSubmitting: SignalObject<boolean>
  serverState: SignalObject<OrgInvitationModel>
  state: OrgInvitationFormState
  errors: OrgInvitationFormErrorState
  hasErrors: () => boolean
  fillTestData: () => void
  loadData: (data: OrgInvitationModel) => void
  validateOnChange: (field: OrgInvitationFormField) => Scheduled<[value: string]>
  handleSubmit: (e: SubmitEvent) => Promise<void>
  debouncedSave: () => void
}

function createEmptyOrgInvitation(): OrgInvitationModel {
  const now = new Date()
  const iso = now.toISOString()
  return {
    orgHandle: "",
    invitedName: "",
    invitedEmail: "",
    invitationCode: "",
    l: language.en,
    role: orgRole.member,
    invitedBy: "",
    emailSendAt: iso,
    emailSendAmount: 0,
    createdAt: iso,
    updatedAt: iso,
  }
}

export type OrgInvitationFormAddFn = (state: OrgInvitationFormData) => Promise<void>
export type OrgInvitationFormEditFn = (state: OrgInvitationFormData) => Promise<void>
export type OrgInvitationFormRemoveFn = () => Promise<void>

type OrgInvitationFormActions = {
  add?: OrgInvitationFormAddFn
  edit?: OrgInvitationFormEditFn
  remove?: OrgInvitationFormRemoveFn
}

export function orgInvitationFormStateManagement(
  mode: FormMode,
  orgHandle: string,
  invitationCode?: string,
  orgInvitation?: OrgInvitationModel,
): OrgInvitationFormStateManagement {
  const actions: OrgInvitationFormActions = createActions(mode, orgHandle, invitationCode)
  const serverState = createSignalObject(createEmptyOrgInvitation())
  const isSubmitting = createSignalObject(false)
  const state = createOrgInvitationFormState()

  if (mode === formMode.add) {
    orgInvitationFormLocalStorage.loadData((data) => loadPartialData(data, state))
  } else if (orgInvitation) {
    loadData(orgInvitation, serverState, state)
  }

  const errors = createOrgInvitationErrorState()

  const debouncedSave = orgInvitationFormLocalStorage.createDebounceSave(mode, state)

  return {
    mode,
    isSubmitting,
    serverState,
    state,
    loadData: (data: OrgInvitationModel) => loadData(data, serverState, state),
    errors,
    hasErrors: () => hasErrors(errors),
    fillTestData: () => fillTestData(state, errors),
    validateOnChange: (field: OrgInvitationFormField) => {
      debouncedSave()
      return validateOnChange(field, state, errors)
    },
    handleSubmit: (e: SubmitEvent) => handleSubmit(e, isSubmitting, serverState, state, errors, actions),
    debouncedSave,
  }
}

function loadData(
  data: OrgInvitationModel,
  serverState: SignalObject<OrgInvitationModel>,
  state: OrgInvitationFormState,
): void {
  serverState.set(data)
  state.invitedName.set(data.invitedName)
  state.invitedEmail.set(data.invitedEmail)
  state.role.set(data.role)
  state.l.set(data.l)
}

function loadPartialData(data: Partial<OrgInvitationFormData>, state: OrgInvitationFormState): void {
  if (data.invitedName) state.invitedName.set(data.invitedName)
  if (data.invitedEmail) state.invitedEmail.set(data.invitedEmail)
  if (data.role) state.role.set(data.role as OrgRole)
  if (data.l) state.l.set(data.l as Language)
}

function hasErrors(errors: OrgInvitationFormErrorState) {
  return !!errors.invitedEmail.get() || !!errors.role.get() || !!errors.l.get()
}

function fillTestData(state: OrgInvitationFormState, errors: OrgInvitationFormErrorState) {
  state.invitedName.set("Alice")
  state.invitedEmail.set("test@example.com")
  state.role.set("member")
  state.l.set(language.en)

  for (const field of Object.values(orgInvitationFormField)) {
    updateFieldError(field, state[field].get(), state, errors)
  }
}

function validateOnChange(
  field: OrgInvitationFormField,
  state: OrgInvitationFormState,
  errors: OrgInvitationFormErrorState,
) {
  return debounce((value: string) => {
    updateFieldError(field, value, state, errors)
  }, debounceMs)
}

function updateFieldError(
  field: OrgInvitationFormField,
  value: string,
  state: OrgInvitationFormState,
  errors: OrgInvitationFormErrorState,
) {
  const result = validateFieldResult(field, value)
  const errorSig = errors[field as keyof typeof errors]
  if (result.success) {
    errorSig.set("")
  } else {
    errorSig.set(result.issues[0].message)
  }
}

function validateFieldResult(field: OrgInvitationFormField, value: string | Language) {
  const schema = orgInvitationFormConfig[field].schema
  return a.safeParse(schema!, value)
}

async function handleSubmit(
  e: SubmitEvent,
  isSubmitting: SignalObject<boolean>,
  serverState: SignalObject<OrgInvitationModel>,
  state: OrgInvitationFormState,
  errors: OrgInvitationFormErrorState,
  actions: OrgInvitationFormActions,
): Promise<void> {
  e.preventDefault()

  if (isSubmitting.get()) {
    const title = ttc("Submission in progress, please wait")
    console.info(title)
    return
  }

  const invitedName = state.invitedName.get()
  const invitedEmail = state.invitedEmail.get()
  const role = state.role.get()
  const l = state.l.get()

  const invitedNameResult = validateFieldResult(orgInvitationFormField.invitedName, invitedName)
  const invitedEmailResult = validateFieldResult(orgInvitationFormField.invitedEmail, invitedEmail)
  const roleResult = validateFieldResult(orgInvitationFormField.role, role)
  const lResult = validateFieldResult(orgInvitationFormField.l, l)

  errors.invitedName.set(invitedNameResult.success ? "" : invitedNameResult.issues[0].message)
  errors.invitedEmail.set(invitedEmailResult.success ? "" : invitedEmailResult.issues[0].message)
  errors.role.set(roleResult.success ? "" : roleResult.issues[0].message)
  errors.l.set(lResult.success ? "" : lResult.issues[0].message)

  const isSuccess = invitedNameResult.success && invitedEmailResult.success && roleResult.success && lResult.success

  if (!isSuccess) {
    if (!invitedEmailResult.success) {
      toastAdd({
        title: invitedEmailResult.issues[0].message,
        icon: mdiAlertCircle,
        id: orgInvitationFormField.invitedEmail,
      })
    }
    if (!roleResult.success) {
      toastAdd({
        title: roleResult.issues[0].message,
        icon: mdiAlertCircle,
        id: orgInvitationFormField.role,
      })
    }
    return
  }

  isSubmitting.set(true)

  if (actions.add) {
    const data: OrgInvitationFormData = {
      invitedName,
      invitedEmail,
      role: role as OrgRole,
      l,
    }
    await actions.add(data)
  }

  if (actions.edit) {
    const data: OrgInvitationFormData = {
      invitedName,
      invitedEmail,
      role: role as OrgRole,
      l,
    }
    await actions.edit(data)
  }

  if (actions.remove) {
    await actions.remove()
  }

  isSubmitting.set(false)
}

//
// Actions
//

function createActions(
  mode: FormMode,
  orgHandle: string,
  invitationCode: string | undefined,
): OrgInvitationFormActions {
  const actions: OrgInvitationFormActions = {}
  if (mode === formMode.add) {
    const addMutation = mutationCreate(api.org.orgInvitation20InitMutation)
    actions.add = async (data) => addAction(data, orgHandle, addMutation)
  }
  if (mode === formMode.edit) {
    // Edit functionality not implemented for invitations yet
  }
  if (mode === formMode.remove) {
    const resendAction = mutationCreate(api.org.orgInvitation60DismissMutation)
    actions.remove = async () => removeAction(orgHandle, invitationCode, resendAction)
  }
  return actions
}

interface OrgInvitationCreateMutationProps extends HasToken {
  orgHandle: string
  invitedName: string
  invitedEmail: string
  l: Language
  role: OrgRole
}

interface OrgInvitationResendActionProps extends HasToken {
  invitationCode: string
}

async function addAction(
  data: OrgInvitationFormData,
  orgHandle: string,
  addMutation: (data: OrgInvitationCreateMutationProps) => Promise<Result<string>>,
): Promise<void> {
  const invitationIdResult = await addMutation({
    token: userTokenGet(),
    orgHandle,
    invitedName: data.invitedName,
    invitedEmail: data.invitedEmail,
    l: languageSignalGet(),
    role: data.role as OrgRole,
  })
  if (!invitationIdResult.success) {
    console.error(invitationIdResult)
    toastAdd({
      title: invitationIdResult.errorMessage,
      variant: toastVariant.error,
    })
    return
  }
  orgInvitationFormLocalStorage.clearLocalStorage()
  const url = urlOrgInvitationList(orgHandle)
  navigateTo(url)
}

async function removeAction(
  orgHandle: string,
  invitationCode: string | undefined,
  resendAction: (data: OrgInvitationResendActionProps) => Promise<Result<null>>,
) {
  if (!invitationCode) {
    toastAdd({ title: "!invitationCode", variant: toastVariant.error })
    return
  }
  const result = await resendAction({
    token: userTokenGet(),
    invitationCode,
  })
  if (!result.success) {
    console.error(result)
    toastAdd({ title: result.errorMessage, variant: toastVariant.error })
    return
  }
  const url = urlOrgInvitationList(orgHandle)
  navigateTo(url)
}
