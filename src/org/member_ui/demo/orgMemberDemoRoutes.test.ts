import { flush } from "solid-js"
import { afterEach, expect, mock, test } from "bun:test"
import { createRoot } from "solid-js"
import { pageDemoFixtureStoreGet } from "#src/app/demos/pageDemoFixtureStoreGet.ts"
import { pageDemoHref } from "#src/app/demos/pageDemoHref.ts"
import { pageDemoRouteIsMounted } from "#src/app/demos/pageDemoRouteIsMounted.ts"
import { formMode } from "#ui/input/form/formMode.ts"

const visited: string[] = []
let memberId = "member-1"
mock.module("@tanstack/solid-router", () => ({
  useNavigate:
    () =>
    async ({ to }: { to: string }) => {
      visited.push(to)
    },
  useParams: () => () => ({ orgHandle: "sample-org", memberId }),
}))

afterEach(() => {
  pageDemoFixtureStoreGet().clear()
  memberId = "member-1"
  visited.length = 0
})

test("org member detail shows fixture identity and role with navigable demo actions", async () => {
  for (const action of ["view", "edit", "remove"] as const) {
    const route = `/org/:orgHandle/members/:memberId/${action}`
    expect(pageDemoRouteIsMounted(route)).toBe(true)
  }
  expect(pageDemoHref("/org/:orgHandle/members", { orgHandle: "sample-org" })).toBe("/demos/org/sample-org/members")
  expect(
    pageDemoHref("/org/:orgHandle/members/:memberId/edit", { orgHandle: "sample-org", memberId: "member-1" }),
  ).toBe("/demos/org/sample-org/members/member-1/edit")
  expect(
    pageDemoHref("/org/:orgHandle/members/:memberId/remove", { orgHandle: "sample-org", memberId: "member-1" }),
  ).toBe("/demos/org/sample-org/members/member-1/remove")
})

test("editing a selected member changes only its shared organization fixture and navigates to its demo view", async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = (() => {
    throw new Error("Demo reached network")
  }) as unknown as typeof fetch
  let dispose = () => {}
  try {
    const [{ orgMemberDemoStateCreate }, { orgDemoStateCreate }] = await Promise.all([
      import("#src/org/member_ui/demo/orgMemberDemoStateCreate.ts"),
      import("#src/org/org_ui/demo/orgDemoStateCreate.ts"),
    ])
    const edit = createRoot((cleanup) => {
      dispose = cleanup
      return orgMemberDemoStateCreate(formMode.edit)
    })
    expect(edit.member()?.userId).toBe("sample-user")
    expect(edit.form.state.role.get()).toBe("member")
    flush()
    edit.form.state.role.set("guest")
    flush()
    await edit.form.handleSubmit({ preventDefault() {} } as SubmitEvent)
    flush()
    expect(edit.member()?.role).toBe("guest")
    expect(pageDemoFixtureStoreGet().get<{ role: string }[]>("page-demo:org-members:sample-org")?.[0]?.role).toBe(
      "guest",
    )
    expect(orgDemoStateCreate().members()[0]?.role).toBe("guest")
    expect(visited).toEqual(["/demos/org/sample-org/members/member-1/view"])
    const otherPage = orgMemberDemoStateCreate(formMode.remove)
    expect(otherPage.form.state.role.get()).toBe("guest")
  } finally {
    dispose()
    globalThis.fetch = originalFetch
  }
})

test("removing a member updates the shared fixture and the next add does not reuse another member ID", async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = (() => {
    throw new Error("Demo reached network")
  }) as unknown as typeof fetch
  let dispose = () => {}
  try {
    const [{ orgMemberDemoStateCreate }, { orgDemoStateCreate }] = await Promise.all([
      import("#src/org/member_ui/demo/orgMemberDemoStateCreate.ts"),
      import("#src/org/org_ui/demo/orgDemoStateCreate.ts"),
    ])
    const state = createRoot((cleanup) => {
      dispose = cleanup
      return orgMemberDemoStateCreate()
    })
    flush()
    await state.form.handleSubmit({ preventDefault() {} } as SubmitEvent)
    memberId = "member-1"
    const remove = orgMemberDemoStateCreate(formMode.remove)
    flush()
    await remove.form.handleSubmit({ preventDefault() {} } as SubmitEvent)
    expect(remove.member()).toBeUndefined()
    expect(
      orgDemoStateCreate()
        .members()
        .map((item) => item.memberId),
    ).toEqual(["member-2"])
    expect(
      orgMemberDemoStateCreate()
        .members()
        .map((item) => item.memberId),
    ).toEqual(["member-2"])
    expect(visited.at(-1)).toBe("/demos/org/sample-org/members")
    const add = orgMemberDemoStateCreate()
    add.chooseUser("another-user")
    flush()
    await add.form.handleSubmit({ preventDefault() {} } as SubmitEvent)
    flush()
    expect(add.members().map((item) => item.memberId)).toEqual(["member-2", "member-3"])
  } finally {
    dispose()
    globalThis.fetch = originalFetch
  }
})

test("missing member routes do not edit or remove unrelated fixture members", async () => {
  let dispose = () => {}
  try {
    const { orgMemberDemoStateCreate } = await import("#src/org/member_ui/demo/orgMemberDemoStateCreate.ts")
    const state = createRoot((cleanup) => {
      dispose = cleanup
      return orgMemberDemoStateCreate()
    })
    memberId = "missing-member"
    const edit = orgMemberDemoStateCreate(formMode.edit)
    const remove = orgMemberDemoStateCreate(formMode.remove)
    flush()
    await edit.form.handleSubmit({ preventDefault() {} } as SubmitEvent)
    flush()
    await remove.form.handleSubmit({ preventDefault() {} } as SubmitEvent)
    expect(state.members().map((item) => item.memberId)).toEqual(["member-1"])
    expect(visited).toEqual([])
  } finally {
    dispose()
  }
})
