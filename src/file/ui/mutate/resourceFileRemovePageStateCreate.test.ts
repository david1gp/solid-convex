import { flush } from "solid-js"
import { convexContextRootCreate } from "#src/utils/convex_client/test/convexContextRootCreate.ts"
import { describe, expect, mock, test } from "bun:test"
import { createResult } from "#result"

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
const { resourceFileRemovePageStateCreate } = await import("./resourceFileRemovePageStateCreate.ts")
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

describe("resourceFileRemovePageStateCreate", () => {
  test("confirmation blocks while file data is loading", () => {
    const client = new MockConvexClient()
    convexContextRootCreate(client, (dispose) => {
      const [resourceId] = createSignal("res-1")
      const [fileId] = createSignal("file-1")
      const state = resourceFileRemovePageStateCreate({ resourceId, fileId })

      expect(state.isLoading()).toBe(true)
      expect(state.canConfirm()).toBe(false)

      flush()
      state.typedConfirmation.set("DELETE")
      flush()
      expect(state.canConfirm()).toBe(false)

      dispose()
    })
  })

  test("confirmation blocks until typed confirmation matches displayName or DELETE", () => {
    const client = new MockConvexClient()
    convexContextRootCreate(client, (dispose) => {
      const [resourceId] = createSignal("res-1")
      const [fileId] = createSignal("file-1")
      const state = resourceFileRemovePageStateCreate({ resourceId, fileId })

      client.notifyQuery(
        (args: any) => args?.fileId === "file-1",
        createResult({
          fileId: "file-1",
          resourceId: "res-1",
          displayName: "dataset.csv",
        }),
      )

      flush()
      expect(state.isLoading()).toBe(false)
      expect(state.displayName()).toBe("dataset.csv")
      expect(state.canConfirm()).toBe(false)

      // Invalid input
      flush()
      state.typedConfirmation.set("other.csv")
      flush()
      expect(state.isTypedConfirmationValid()).toBe(false)
      expect(state.canConfirm()).toBe(false)

      // Match displayName
      flush()
      state.typedConfirmation.set("dataset.csv")
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

  test("file storage objects are not claimed deleted; R2 storage is retained", () => {
    const client = new MockConvexClient()
    convexContextRootCreate(client, (dispose) => {
      const [resourceId] = createSignal("res-1")
      const [fileId] = createSignal("file-1")
      const state = resourceFileRemovePageStateCreate({ resourceId, fileId })

      client.notifyQuery(
        (args: any) => args?.fileId === "file-1",
        createResult({
          fileId: "file-1",
          resourceId: "res-1",
          displayName: "image.png",
        }),
      )

      const effects = state.effects()
      const fileItem = effects.find((e) => e.key === "file")
      const linkItem = effects.find((e) => e.key === "link")
      const storageItem = effects.find((e) => e.key === "storage")

      // 1 file record metadata deleted
      expect(fileItem?.count).toBe(1)
      expect(fileItem?.status).toBe("deleted")

      // 1 resource relationship unlinked
      expect(linkItem?.count).toBe(1)
      expect(linkItem?.status).toBe("unlinked")

      // 0 R2 storage objects deleted (retained)
      expect(storageItem?.count).toBe(0)
      expect(storageItem?.status).toBe("retained")

      dispose()
    })
  })

  test("captures mutation in owner at setup and executes bound mutation when handler is called later outside owner", async () => {
    const client = new MockConvexClient()
    let successCalled = false
    let state!: ReturnType<typeof resourceFileRemovePageStateCreate>

    const dispose = convexContextRootCreate(client, (disposeRoot) => {
      const [resourceId] = createSignal("res-1")
      const [fileId] = createSignal("file-1")
      state = resourceFileRemovePageStateCreate({
        resourceId,
        fileId,
        onSuccess: () => {
          successCalled = true
        },
      })
      return disposeRoot
    })

    client.notifyQuery(
      (args: any) => args?.fileId === "file-1",
      createResult({
        fileId: "file-1",
        resourceId: "res-1",
        displayName: "dataset.csv",
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
      fileId: "file-1",
    })
    expect(successCalled).toBe(true)

    dispose()
  })
})
