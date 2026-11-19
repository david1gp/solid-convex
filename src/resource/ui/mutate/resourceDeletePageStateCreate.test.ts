import { flush } from "solid-js"
import { convexContextRootCreate } from "#src/utils/convex_client/test/convexContextRootCreate.ts"
import { describe, expect, mock, test } from "bun:test"
import { createResult, createResultError } from "#result"

if (!globalThis.sessionStorage) {
  globalThis.sessionStorage = {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
    clear: () => undefined,
    key: () => null,
    length: 0,
  } as unknown as Storage
}
if (!globalThis.localStorage) {
  globalThis.localStorage = {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
    clear: () => undefined,
    key: () => null,
    length: 0,
  } as unknown as Storage
}

import { getOwner, createRoot, createSignal } from "solid-js"
const { resourceDeletePageStateCreate } = await import("./resourceDeletePageStateCreate.ts")
mock.restore()

type QueryUpdate = (value: unknown) => void

class MockConvexClient {
  subscriptions: Array<{ query: unknown; args: unknown; update: QueryUpdate }> = []
  mutations: Array<{ mutation: unknown; args: unknown }> = []

  mutation(mutation: unknown, args: unknown) {
    this.mutations.push({ mutation, args })
    return Promise.resolve(createResult(true))
  }

  onUpdate(query: unknown, args: unknown, update: QueryUpdate) {
    const entry = { query, args, update }
    this.subscriptions.push(entry)
    return () => {
      const idx = this.subscriptions.indexOf(entry)
      if (idx >= 0) this.subscriptions.splice(idx, 1)
    }
  }

  notifyQuery(matcher: (args: unknown) => boolean, value: unknown) {
    for (const sub of this.subscriptions) {
      if (matcher(sub.args)) {
        flush()
        sub.update(value)
      }
    }
  }
}

describe("resourceDeletePageStateCreate", () => {
  test("confirmation blocks while count/preview is loading", () => {
    const client = new MockConvexClient()
    convexContextRootCreate(client, (dispose) => {
      const [resourceId] = createSignal("res-1")
      const state = resourceDeletePageStateCreate({ resourceId })

      expect(state.isLoading()).toBe(true)
      expect(state.canConfirm()).toBe(false)

      flush()
      state.typedConfirmation.set("DELETE")
      flush()
      // Still blocks because preview is loading
      expect(state.canConfirm()).toBe(false)

      dispose()
    })
  })

  test("confirmation blocks until typed confirmation matches name or DELETE", async () => {
    const client = new MockConvexClient()
    convexContextRootCreate(client, (dispose) => {
      const [resourceId] = createSignal("res-1")
      const state = resourceDeletePageStateCreate({ resourceId })

      // Provide preview query result
      client.notifyQuery(
        (args: any) => args?.resourceId === "res-1",
        createResult({
          resourceId: "res-1",
          name: "Annual Report",
          linkedFilesCount: 3,
          isTruncated: false,
        }),
      )

      flush()
      expect(state.isLoading()).toBe(false)
      expect(state.title()).toBe("Annual Report")
      expect(state.canConfirm()).toBe(false)

      // Invalid input
      flush()
      state.typedConfirmation.set("Wrong Name")
      flush()
      expect(state.isTypedConfirmationValid()).toBe(false)
      expect(state.canConfirm()).toBe(false)

      // Match entity name
      flush()
      state.typedConfirmation.set("Annual Report")
      flush()
      expect(state.isTypedConfirmationValid()).toBe(true)
      expect(state.canConfirm()).toBe(true)

      // Match DELETE keyword
      flush()
      state.typedConfirmation.set("DELETE")
      flush()
      expect(state.isTypedConfirmationValid()).toBe(true)
      expect(state.canConfirm()).toBe(true)

      dispose()
    })
  })

  test("blocks confirmation when linked files count exceeds preview limit and is truncated", () => {
    const client = new MockConvexClient()
    convexContextRootCreate(client, (dispose) => {
      const [resourceId] = createSignal("res-large")
      const state = resourceDeletePageStateCreate({ resourceId })

      client.notifyQuery(
        (args: any) => args?.resourceId === "res-large",
        createResult({
          resourceId: "res-large",
          name: "Large Resource",
          linkedFilesCount: 100,
          isTruncated: true,
        }),
      )

      flush()
      expect(state.isTruncated()).toBe(true)
      flush()
      state.typedConfirmation.set("DELETE")
      flush()
      expect(state.isTypedConfirmationValid()).toBe(true)
      // Blocked because it's truncated
      expect(state.canConfirm()).toBe(false)

      dispose()
    })
  })

  test("resource linked files are not claimed deleted; files and R2 storage are retained", () => {
    const client = new MockConvexClient()
    convexContextRootCreate(client, (dispose) => {
      const [resourceId] = createSignal("res-files")
      const state = resourceDeletePageStateCreate({ resourceId })

      client.notifyQuery(
        (args: any) => args?.resourceId === "res-files",
        createResult({
          resourceId: "res-files",
          name: "Doc Collection",
          linkedFilesCount: 5,
          isTruncated: false,
        }),
      )

      flush()
      const effects = state.effects()
      const resourceItem = effects.find((e) => e.key === "resource")
      const linksItem = effects.find((e) => e.key === "links")
      const filesItem = effects.find((e) => e.key === "files")
      const storageItem = effects.find((e) => e.key === "storage")

      // 1 resource metadata deleted
      expect(resourceItem?.count).toBe(1)
      expect(resourceItem?.status).toBe("deleted")

      // 5 relationships unlinked
      expect(linksItem?.count).toBe(5)
      expect(linksItem?.status).toBe("unlinked")

      // 0 file records deleted (retained)
      expect(filesItem?.count).toBe(0)
      expect(filesItem?.status).toBe("retained")

      // 0 R2 storage objects deleted (retained)
      expect(storageItem?.count).toBe(0)
      expect(storageItem?.status).toBe("retained")

      dispose()
    })
  })

  test("captures mutation in owner at setup and executes bound mutation when handler is called later outside owner", async () => {
    const client = new MockConvexClient()
    let successCalled = false
    let state!: ReturnType<typeof resourceDeletePageStateCreate>

    const dispose = convexContextRootCreate(client, (disposeRoot) => {
      const [resourceId] = createSignal("res-1")
      state = resourceDeletePageStateCreate({
        resourceId,
        onSuccess: () => {
          successCalled = true
        },
      })
      return disposeRoot
    })

    client.notifyQuery(
      (args: any) => args?.resourceId === "res-1",
      createResult({
        resourceId: "res-1",
        name: "Annual Report",
        linkedFilesCount: 2,
        isTruncated: false,
      }),
    )

    expect(getOwner()).toBeNull()
    flush()
    state.typedConfirmation.set("DELETE")
    flush()
    expect(state.canConfirm()).toBe(true)

    flush()
    await state.onConfirm()
    flush()

    expect(client.mutations.length).toBe(1)
    const firstMutation = client.mutations[0]
    expect(firstMutation?.args).toEqual({
      token: "",
      resourceId: "res-1",
    })
    expect(successCalled).toBe(true)

    dispose()
  })
})
