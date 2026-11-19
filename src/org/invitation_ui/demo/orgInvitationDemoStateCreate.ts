import { debounce } from "@solid-primitives/scheduled"
import { useNavigate, useParams } from "@tanstack/solid-router"
import { untrack } from "solid-js"
import * as a from "valibot"
import { pageDemoFixtureStoreGet } from "#src/app/demos/pageDemoFixtureStoreGet.ts"
import { pageDemoHref } from "#src/app/demos/pageDemoHref.ts"
import { type Language, language } from "#src/app/i18n/language.ts"
import type { OrgInvitationModel } from "#src/org/invitation_model/orgInvitationSchema.ts"
import { orgInvitationDemoAccept } from "#src/org/invitation_ui/demo/orgInvitationDemoAccept.ts"
import { orgInvitationDemoAdd } from "#src/org/invitation_ui/demo/orgInvitationDemoAdd.ts"
import { orgInvitationDemoFixturesGet } from "#src/org/invitation_ui/demo/orgInvitationDemoFixturesGet.ts"
import {
  type OrgInvitationFormField,
  orgInvitationFormConfig,
  orgInvitationFormField,
} from "#src/org/invitation_ui/form/orgInvitationFormField.ts"
import type { OrgInvitationFormStateManagement } from "#src/org/invitation_ui/form/orgInvitationFormStateManagement.ts"
import { orgRole } from "#src/org/org_model_field/orgRole.ts"
import { formMode } from "#ui/input/form/formMode.ts"
import { createSignalObject } from "#ui/utils/createSignalObject.ts"

export function orgInvitationDemoStateCreate() {
  const params = useParams({ strict: false })
  const navigate = useNavigate()
  const orgHandle = () => params().orgHandle ?? "sample-org"
  const invitationCode = () => params().invitationCode ?? "invite-1"
  const key = () => `page-demo:org-invitations:${orgHandle()}`
  const invitations = createSignalObject(untrack(() => orgInvitationDemoFixturesGet(orgHandle())))
  const accepted = createSignalObject(false)
  const acceptedInvitation = createSignalObject<OrgInvitationModel | undefined>(undefined)
  const isSubmitting = createSignalObject(false)
  const state = {
    invitedName: createSignalObject(""),
    invitedEmail: createSignalObject(""),
    l: createSignalObject<Language>(language.en),
    role: createSignalObject<string>(orgRole.member),
  }
  const errors = {
    invitedName: createSignalObject(""),
    invitedEmail: createSignalObject(""),
    l: createSignalObject(""),
    role: createSignalObject(""),
  }

  function validate(field: OrgInvitationFormField, value: string) {
    const result = a.safeParse(orgInvitationFormConfig[field].schema, value)
    errors[field].set(result.success ? "" : result.issues[0].message)
    return result.success
  }

  const form: OrgInvitationFormStateManagement = {
    mode: formMode.add,
    state,
    errors,
    isSubmitting,
    serverState: createSignalObject<OrgInvitationModel>({
      orgHandle: "",
      invitationCode: "",
      invitedName: "",
      invitedEmail: "",
      l: language.en,
      role: orgRole.member,
      invitedBy: "",
      emailSendAmount: 0,
      createdAt: "2026-09-28T09:00:00.000Z",
      updatedAt: "2026-09-28T09:00:00.000Z",
    }),
    hasErrors: () => Object.values(errors).some((error) => !!error.get()),
    fillTestData: () => {
      state.invitedName.set("Taylor Demo")
      state.invitedEmail.set("taylor@example.com")
      state.l.set(language.en)
      state.role.set(orgRole.member)
    },
    loadData: (data) => {
      state.invitedName.set(data.invitedName)
      state.invitedEmail.set(data.invitedEmail)
      state.l.set(data.l)
      state.role.set(data.role)
    },
    validateOnChange: (field) =>
      debounce((value: string) => {
        validate(field, value)
      }, 200),
    debouncedSave: () => {},
    handleSubmit: async (event) => {
      event.preventDefault()
      if (isSubmitting.get()) return
      const valid = Object.values(orgInvitationFormField)
        .map((field) => validate(field, state[field].get()))
        .every(Boolean)
      if (!valid) return
      isSubmitting.set(true)
      const data = a.safeParse(
        a.object({
          invitedName: orgInvitationFormConfig.invitedName.schema,
          invitedEmail: orgInvitationFormConfig.invitedEmail.schema,
          l: orgInvitationFormConfig.l.schema,
          role: orgInvitationFormConfig.role.schema,
        }),
        {
          invitedName: state.invitedName.get(),
          invitedEmail: state.invitedEmail.get(),
          l: state.l.get(),
          role: state.role.get(),
        },
      )
      if (!data.success) {
        isSubmitting.set(false)
        return
      }
      invitations.set(
        pageDemoFixtureStoreGet().set(key(), orgInvitationDemoAdd(invitations.get(), orgHandle(), data.output)),
      )
      await navigate({ to: pageDemoHref("/org/:orgHandle/invitations", { orgHandle: orgHandle() }) })
      isSubmitting.set(false)
    },
  }

  return {
    orgHandle,
    invitationCode,
    invitations: invitations.get,
    invitation: () =>
      acceptedInvitation.get() ?? invitations.get().find((item) => item.invitationCode === invitationCode()),
    form,
    accepted: accepted.get,
    accept: () => {
      if (!invitations.get().some((item) => item.invitationCode === invitationCode()) || accepted.get()) return
      acceptedInvitation.set(invitations.get().find((item) => item.invitationCode === invitationCode()))
      invitations.set(
        pageDemoFixtureStoreGet().set(key(), orgInvitationDemoAccept(invitations.get(), invitationCode())),
      )
      accepted.set(true)
    },
  }
}
