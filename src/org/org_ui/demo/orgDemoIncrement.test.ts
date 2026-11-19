import { flush } from "solid-js"
import { afterEach, expect, mock, test } from "bun:test"
import { createRoot } from "solid-js"
import { pageDemoFixtureStoreGet } from "#src/app/demos/pageDemoFixtureStoreGet.ts"
import { formMode } from "#ui/input/form/formMode.ts"

const visited: string[] = []
mock.module("@tanstack/solid-router", () => ({
  useNavigate: () => async (options: { to: string }) => {
    visited.push(options.to)
  },
  useParams: () => () => ({ orgHandle: "sample-org" }),
}))
afterEach(() => {
  pageDemoFixtureStoreGet().clear()
  visited.length = 0
})

test("editing and removing an organization update only the shared gallery fixtures", async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = (() => {
    throw new Error("Demo reached network")
  }) as unknown as typeof fetch
  let dispose = () => {}
  try {
    const { orgDemoStateCreate } = await import("#src/org/org_ui/demo/orgDemoStateCreate.ts")
    const edit = createRoot((cleanup) => {
      dispose = cleanup
      return orgDemoStateCreate(formMode.edit)
    })
    flush()
    edit.form.state.name.set("Renamed Organization")
    flush()
    await edit.form.handleSubmit({ preventDefault() {} } as SubmitEvent)
    flush()
    expect(edit.org()?.name).toBe("Renamed Organization")
    expect(visited).toEqual(["/demos/org/sample-org"])
    const remove = orgDemoStateCreate(formMode.remove)
    flush()
    await remove.form.handleSubmit({ preventDefault() {} } as SubmitEvent)
    expect(remove.org()).toBeUndefined()
    expect(orgDemoStateCreate().orgs()).toEqual([])
    expect(visited.at(-1)).toBe("/demos/org")
  } finally {
    dispose()
    globalThis.fetch = originalFetch
  }
})

test("adding a member updates the organization-scoped gallery list without network calls", async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = (() => {
    throw new Error("Demo reached network")
  }) as unknown as typeof fetch
  let dispose = () => {}
  try {
    const { orgMemberDemoStateCreate } = await import("#src/org/member_ui/demo/orgMemberDemoStateCreate.ts")
    const state = createRoot((cleanup) => {
      dispose = cleanup
      return orgMemberDemoStateCreate()
    })
    flush()
    state.form.state.role.set("guest")
    flush()
    await state.form.handleSubmit({ preventDefault() {} } as SubmitEvent)
    flush()
    expect(state.members().map((member) => [member.userId, member.role])).toEqual([
      ["sample-user", "member"],
      ["new-user", "guest"],
    ])
    expect(orgMemberDemoStateCreate().members()).toHaveLength(2)
    expect(visited).toEqual(["/demos/org/sample-org/members"])
    flush()
    await state.form.handleSubmit({ preventDefault() {} } as SubmitEvent)
    expect(state.members()).toHaveLength(2)
    expect(state.userError()).toContain("already a member")
  } finally {
    dispose()
    globalThis.fetch = originalFetch
  }
})

test("leaving an organization removes only local gallery access", async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = (() => {
    throw new Error("Demo reached network")
  }) as unknown as typeof fetch
  let dispose = () => {}
  try {
    const { orgDemoStateCreate } = await import("#src/org/org_ui/demo/orgDemoStateCreate.ts")
    const state = createRoot((cleanup) => {
      dispose = cleanup
      return orgDemoStateCreate()
    })
    expect(state.org()?.orgHandle).toBe("sample-org")
    await state.leave()
    expect(state.orgs()).toEqual([])
    expect(visited).toEqual(["/demos/org"])
  } finally {
    dispose()
    globalThis.fetch = originalFetch
  }
})
