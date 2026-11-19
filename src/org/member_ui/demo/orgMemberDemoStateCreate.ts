import { debounce } from "@solid-primitives/scheduled"
import { useNavigate, useParams } from "@tanstack/solid-router"
import { untrack } from "solid-js"
import * as a from "valibot"
import { pageDemoFixtureStoreGet } from "#src/app/demos/pageDemoFixtureStoreGet.ts"
import { pageDemoHref } from "#src/app/demos/pageDemoHref.ts"
import type { OrgMemberModel } from "#src/org/member_model/OrgMemberModel.ts"
import type { OrgMemberProfile } from "#src/org/member_model/OrgMemberProfile.ts"
import type { OrgMemberFormStateManagement } from "#src/org/member_ui/form/orgMemberFormStateManagement.ts"
import { orgRole, orgRoleSchema } from "#src/org/org_model_field/orgRole.ts"
import { formMode } from "#ui/input/form/formMode.ts"
import { createSignalObject } from "#ui/utils/createSignalObject.ts"

const date = "2026-09-28T09:00:00.000Z"

export function orgMemberDemoStateCreate(
  mode: typeof formMode.add | typeof formMode.edit | typeof formMode.remove = formMode.add,
) {
  const params = useParams({ strict: false })
  const navigate = useNavigate()
  const orgHandle = () => params().orgHandle ?? "sample-org"
  const memberId = () => params().memberId ?? "member-1"
  const fixtureKey = () => `page-demo:org-members:${orgHandle()}`
  const store = pageDemoFixtureStoreGet()
  const members = createSignalObject<OrgMemberProfile[]>(
    untrack(
      () =>
        store.get<OrgMemberProfile[]>(fixtureKey()) ??
        store.set(fixtureKey(), [
          {
            orgHandle: orgHandle(),
            memberId: "member-1",
            userId: "sample-user",
            role: orgRole.member,
            invitedBy: "demo",
            createdAt: date,
            updatedAt: date,
            profile: { userId: "sample-user", name: "Sample User", role: "user", createdAt: date, updatedAt: date },
          },
        ]),
    ),
  )
  const member = () => members.get().find((item) => item.memberId === memberId())
  const initialMember = untrack(member)
  const state = {
    userId: createSignalObject(mode === formMode.add ? "new-user" : (initialMember?.userId ?? "")),
    role: createSignalObject<string>(mode === formMode.add ? orgRole.member : (initialMember?.role ?? orgRole.member)),
  }
  const errors = { userId: createSignalObject(""), role: createSignalObject("") }
  const isSubmitting = createSignalObject(false)
  const serverState = createSignalObject<OrgMemberModel>(
    initialMember ?? {
      memberId: "",
      orgHandle: untrack(orgHandle),
      userId: "",
      role: orgRole.member,
      invitedBy: "demo",
      createdAt: date,
      updatedAt: date,
    },
  )
  const form: OrgMemberFormStateManagement = {
    mode,
    state,
    errors,
    isSubmitting,
    serverState,
    hasErrors: () => !!errors.userId.get() || !!errors.role.get(),
    fillTestData: () => {
      state.userId.set("new-user")
      state.role.set(orgRole.member)
    },
    loadData: (member) => {
      state.userId.set(member.userId)
      state.role.set(member.role)
      serverState.set(member)
    },
    validateOnChange: () => {
      const scheduled = debounce((value: string) => {
        const result = a.safeParse(orgRoleSchema, value)
        errors.role.set(result.success ? "" : result.issues[0].message)
      }, 200)
      return Object.assign((value: string) => scheduled(value), { clear: scheduled.clear })
    },
    handleSubmit: async (event) => {
      event.preventDefault()
      if (isSubmitting.get()) return
      if (mode !== formMode.add && !member()) return
      if (mode === formMode.remove) {
        members.set(
          store.set(
            fixtureKey(),
            members.get().filter((item) => item.memberId !== memberId()),
          ),
        )
        await navigate({ to: pageDemoHref("/org/:orgHandle/members", { orgHandle: orgHandle() }) })
        return
      }
      const result = a.safeParse(orgRoleSchema, state.role.get())
      errors.role.set(result.success ? "" : result.issues[0].message)
      if (!result.success) return
      if (mode === formMode.edit) {
        members.set(
          store.set(
            fixtureKey(),
            members
              .get()
              .map((item) => (item.memberId === memberId() ? { ...item, role: result.output, updatedAt: date } : item)),
          ),
        )
        await navigate({
          to: pageDemoHref("/org/:orgHandle/members/:memberId/view", {
            orgHandle: orgHandle(),
            memberId: memberId(),
          }),
        })
        return
      }
      if (members.get().some((member) => member.userId === state.userId.get())) {
        errors.userId.set("This user is already a member")
        return
      }
      const nextId =
        Math.max(0, ...members.get().map((item) => Number(item.memberId.match(/^member-(\d+)$/)?.[1] ?? 0))) + 1
      const userId = state.userId.get()
      members.set(
        store.set(fixtureKey(), [
          ...members.get(),
          {
            memberId: `member-${nextId}`,
            orgHandle: orgHandle(),
            userId,
            role: result.output,
            invitedBy: "demo",
            createdAt: date,
            updatedAt: date,
            profile: {
              userId,
              name: userId === "new-user" ? "New User" : "Another User",
              role: "user",
              createdAt: date,
              updatedAt: date,
            },
          },
        ]),
      )
      await navigate({ to: pageDemoHref("/org/:orgHandle/members", { orgHandle: orgHandle() }) })
    },
  }
  return {
    orgHandle,
    memberId,
    member,
    members: members.get,
    form,
    chooseUser: (userId: string) => {
      state.userId.set(userId)
      errors.userId.set("")
    },
    selectedUser: state.userId.get,
    userError: errors.userId.get,
  }
}
