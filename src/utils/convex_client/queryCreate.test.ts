import { convexContextRootCreate } from "#src/utils/convex_client/test/convexContextRootCreate.ts"
import { describe, expect, mock, test } from "bun:test"
import type { FunctionReference } from "convex/server"
import { createResult, createResultError } from "#result"

import { createComponent, createRoot, createSignal, flush } from "solid-js"
const { queryCreate } = await import("./queryCreate.ts")
mock.restore()

type QueryUpdate = (value: unknown) => void
type QueryError = (error: unknown) => void

class FakeConvexClient {
  update: QueryUpdate | undefined
  error: QueryError | undefined

  onUpdate(_query: unknown, _args: unknown, update: QueryUpdate, onError?: QueryError) {
    this.update = update
    this.error = onError
    return () => undefined
  }
}

const query = {} as FunctionReference<"query">

describe("queryCreate", () => {
  test("returns a Result error when the Convex context is missing", () => {
    let getResult: (() => unknown) | undefined
    const dispose = createRoot((disposeRoot) => {
      getResult = queryCreate(query)
      return disposeRoot
    })

    expect(getResult?.()).toEqual(createResultError("queryCreate", "No convex context"))
    dispose()
  })

  test("preserves the backend result payload without wrapping it again", () => {
    const client = new FakeConvexClient()
    let getResult: (() => unknown) | undefined
    const dispose = convexContextRootCreate(client, (disposeRoot) => {
      getResult = queryCreate(query)
      return disposeRoot
    })

    expect(getResult?.()).toBeUndefined()
    const backendResult = createResult({ value: "ok" })
    client.update?.(backendResult)
    flush()
    expect(getResult?.()).toBe(backendResult)
    const rawResult = { value: "raw" }
    client.update?.(rawResult)
    flush()
    expect(getResult?.()).toBe(rawResult)
    dispose()
  })

  test("defers synchronous subscription delivery and ignores it after disposal", async () => {
    const client = new FakeConvexClient()
    client.onUpdate = (_query, _args, update) => {
      update({ value: "cached" })
      return () => undefined
    }
    let result: (() => unknown) | undefined
    const dispose = convexContextRootCreate(client, (disposeRoot) => {
      createComponent(() => {
        result = queryCreate(query)
        return null
      }, {})
      return disposeRoot
    })
    expect(result?.()).toBeUndefined()
    await Promise.resolve()
    flush()
    expect(result?.()).toEqual({ value: "cached" })
    dispose()

    let disposedResult: (() => unknown) | undefined
    const disposeImmediately = convexContextRootCreate(client, (disposeRoot) => {
      createComponent(() => {
        disposedResult = queryCreate(query)
        return null
      }, {})
      return disposeRoot
    })
    disposeImmediately()
    await Promise.resolve()
    flush()
    expect(disposedResult?.()).toBeUndefined()
  })

  test("resubscribes when reactive arguments change", async () => {
    const client = new FakeConvexClient()
    const subscriptions: unknown[] = []
    client.onUpdate = (_query, args, update) => {
      subscriptions.push(args)
      client.update = update
      return () => undefined
    }

    let setOrgHandle: ((value: string) => void) | undefined
    const dispose = convexContextRootCreate(client, (disposeRoot) => {
      const [orgHandle, setHandle] = createSignal("")
      setOrgHandle = setHandle
      queryCreate(query, () => ({ orgHandle: orgHandle() }))
      return disposeRoot
    })

    expect(subscriptions).toEqual([{ orgHandle: "" }])
    setOrgHandle?.("sample-org")
    await Promise.resolve()
    expect(subscriptions).toEqual([{ orgHandle: "" }, { orgHandle: "sample-org" }])
    dispose()
  })

  test("does not subscribe when args are skip, undefined, or accessor returns undefined/skip", () => {
    const client = new FakeConvexClient()
    let calls = 0
    client.onUpdate = () => {
      calls += 1
      return () => undefined
    }

    const dispose = convexContextRootCreate(client, (disposeRoot) => {
      const resSkip = queryCreate(query, "skip")
      const resUndefined = queryCreate(query, undefined)
      const resFnUndefined = queryCreate(query, () => undefined)
      const resFnSkip = queryCreate(query, () => "skip")

      expect(resSkip()).toBeUndefined()
      expect(resUndefined()).toBeUndefined()
      expect(resFnUndefined()).toBeUndefined()
      expect(resFnSkip()).toBeUndefined()
      return disposeRoot
    })

    expect(calls).toBe(0)
    dispose()
  })

  test("cleans up previous subscription and clears result when transitioning to skip/undefined", async () => {
    const client = new FakeConvexClient()
    const subscriptions: unknown[] = []
    let unsubscribeCount = 0
    client.onUpdate = (_query, args, update) => {
      subscriptions.push(args)
      client.update = update
      return () => {
        unsubscribeCount += 1
      }
    }

    let setArgs: ((value: { orgHandle: string } | undefined | "skip") => void) | undefined
    let getResult: (() => unknown) | undefined
    const dispose = convexContextRootCreate(client, (disposeRoot) => {
      const [args, set] = createSignal<{ orgHandle: string } | undefined | "skip">({
        orgHandle: "initial-org",
      })
      setArgs = set
      getResult = queryCreate(query, () => args())
      return disposeRoot
    })

    flush()
    expect(subscriptions).toEqual([{ orgHandle: "initial-org" }])
    client.update?.({ name: "Initial Org" })
    flush()
    expect(getResult?.()).toEqual({ name: "Initial Org" })

    // Transition to undefined: cleanup runs, result is cleared, no new subscription
    setArgs?.(undefined)
    await Promise.resolve()
    expect(unsubscribeCount).toBe(1)
    expect(getResult?.()).toBeUndefined()
    expect(subscriptions).toHaveLength(1)

    // Transition back to valid args: resubscribes
    setArgs?.({ orgHandle: "next-org" })
    await Promise.resolve()
    expect(subscriptions).toEqual([{ orgHandle: "initial-org" }, { orgHandle: "next-org" }])
    expect(getResult?.()).toBeUndefined()
    client.update?.({ name: "Next Org" })
    flush()
    expect(getResult?.()).toEqual({ name: "Next Org" })

    // Transition to 'skip': cleanup runs again, result is cleared
    setArgs?.("skip")
    await Promise.resolve()
    expect(unsubscribeCount).toBe(2)
    expect(getResult?.()).toBeUndefined()
    expect(subscriptions).toHaveLength(2)

    dispose()
  })

  test("records error Result when onError callback is invoked", () => {
    const client = new FakeConvexClient()
    let getResult: (() => unknown) | undefined
    const dispose = convexContextRootCreate(client, (disposeRoot) => {
      getResult = queryCreate(query, { orgHandle: "broken" })
      return disposeRoot
    })

    expect(getResult?.()).toBeUndefined()
    client.error?.(new Error("Subscription query failed"))
    flush()
    expect(getResult?.()).toEqual(createResultError("queryCreate", "Subscription query failed"))
    dispose()
  })
})
