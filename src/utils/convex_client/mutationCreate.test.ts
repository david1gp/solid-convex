import { convexContextRootCreate } from "#src/utils/convex_client/test/convexContextRootCreate.ts"
import { describe, expect, test } from "bun:test"
import type { FunctionReference } from "convex/server"
import { createRoot } from "solid-js"
import { createResult, createResultError } from "#result"
import { mutationCreate } from "./mutationCreate.ts"

class FakeConvexClient {
  private readonly value: unknown

  constructor(value: unknown) {
    this.value = value
  }

  mutation() {
    return Promise.resolve(this.value)
  }
}

const mutation = {} as FunctionReference<"mutation">

describe("mutationCreate", () => {
  test("returns a Result error when the Convex context is missing", async () => {
    let runMutation: (() => Promise<unknown>) | undefined
    const dispose = createRoot((disposeRoot) => {
      runMutation = mutationCreate(mutation)
      return disposeRoot
    })

    await expect(runMutation?.()).resolves.toEqual(createResultError("mutationCreate", "No convex context"))
    dispose()
  })

  test("preserves the backend result payload without wrapping it again", async () => {
    const backendResult = createResult({ value: "ok" })
    const client = new FakeConvexClient(backendResult)
    let runMutation: (() => Promise<unknown>) | undefined
    const dispose = convexContextRootCreate(client, (disposeRoot) => {
      runMutation = mutationCreate(mutation)
      return disposeRoot
    })

    const result = await runMutation?.()
    expect(result).toBe(backendResult)

    const rawResult = { value: "raw" }
    const rawClient = new FakeConvexClient(rawResult)
    const rawDispose = convexContextRootCreate(rawClient, (disposeRoot) => {
      runMutation = mutationCreate(mutation)
      return disposeRoot
    })
    expect(await runMutation?.()).toBe(rawResult)

    rawDispose()
    dispose()
  })
})
