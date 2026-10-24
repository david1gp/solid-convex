import { debounce } from "@solid-primitives/scheduled"
import * as a from "valibot"
import { createResult, createResultError, type Result } from "#result"
import { languageSchema } from "#src/app/i18n/language.ts"
import type { OrgInvitationFormState } from "#src/org/invitation_ui/form/orgInvitationFormStateManagement.ts"
import { pageRouteOrgInvitation } from "#src/org/invitation_url/pageRouteOrgInvitation.ts"
import { orgRoleSchema } from "#src/org/org_model_field/orgRole.ts"
import { cachePrefix } from "#src/utils/ui/cachePrefix.ts"
import { debounceSaveMs } from "#src/utils/ui/debounceMs.ts"
import { stringSchema0to100 } from "#src/utils/valibot/stringSchema.ts"
import { type FormMode, formMode } from "#ui/input/form/formMode.ts"

const orgInvitationFormLocalStorageKey = cachePrefix + pageRouteOrgInvitation.orgInvitationAdd

type OrgInvitationFormDataLoadFn = (data: Partial<OrgInvitationFormData>) => void

export type OrgInvitationFormData = {
  invitedName: string
  invitedEmail: string
  role: string
  l: string
}

export type OrgInvitationFormLocalStorage = {
  createDebounceSave(mode: FormMode, state: OrgInvitationFormState): () => void
  loadData(loadFormData: OrgInvitationFormDataLoadFn): void
  clearLocalStorage(): void
}

export const orgInvitationFormLocalStorage: OrgInvitationFormLocalStorage = {
  createDebounceSave,
  loadData,
  clearLocalStorage,
}

function loadData(loadFormData: OrgInvitationFormDataLoadFn): void {
  const loadedData = loadFromLocalStorage()
  if (!loadedData.success) return
  loadFormData(loadedData.data)
}

function saveIdleSchedule(callback: () => void): void {
  if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(() => callback())
  } else if (typeof window !== "undefined") {
    setTimeout(callback, 0)
  } else {
    callback()
  }
}

function createDebounceSave(mode: FormMode, state: OrgInvitationFormState) {
  if (mode !== formMode.add) return () => {}
  return debounce(() => {
    const formData = stateToFormData(state)
    saveIdleSchedule(() => saveToLocalStorage(formData))
  }, debounceSaveMs)
}

function stateToFormData(state: OrgInvitationFormState): Partial<OrgInvitationFormData> {
  const result: Partial<OrgInvitationFormData> = {}

  // Only add fields that have values (not empty strings)
  const invitedName = state.invitedName.get()
  if (invitedName) result.invitedName = invitedName

  const invitedEmail = state.invitedEmail.get()
  if (invitedEmail) result.invitedEmail = invitedEmail

  const role = state.role.get()
  if (role) result.role = role

  const l = state.l.get()
  if (l) result.l = l

  return result
}

function loadFromLocalStorage(): Result<Partial<OrgInvitationFormData>> {
  const key = orgInvitationFormLocalStorageKey
  console.log("loadOrgInvitationFromLocalStorage", key)
  const readValue = localStorage.getItem(key)
  if (!readValue) return createResultError("loadOrgInvitationFromLocalStorage", `no ${key} saved in localStorage`)

  const partialSchema = a.partial(
    a.object({
      invitedName: stringSchema0to100,
      invitedEmail: stringSchema0to100,
      l: languageSchema,
      role: orgRoleSchema,
    }),
  )
  const parsingSchema = a.pipe(a.string(), a.parseJson(), partialSchema)
  const parsing = a.safeParse(parsingSchema, readValue)
  if (!parsing.success) {
    return createResultError("loadOrgInvitationFromLocalStorage", a.summarize(parsing.issues), readValue)
  }
  return createResult(parsing.output as Partial<OrgInvitationFormData>)
}

function saveToLocalStorage(value: Partial<OrgInvitationFormData>) {
  const key = orgInvitationFormLocalStorageKey
  const serialized = JSON.stringify(value, null, 2)
  localStorage.setItem(key, serialized)
}

function clearLocalStorage() {
  localStorage.removeItem(orgInvitationFormLocalStorageKey)
}
