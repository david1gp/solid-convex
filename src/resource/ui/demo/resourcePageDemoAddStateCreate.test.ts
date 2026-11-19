import { flush } from "solid-js"
import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { createRoot } from "solid-js"
import { pageDemoFixtureStoreGet } from "#src/app/demos/pageDemoFixtureStoreGet.ts"
import { resourcePageDemoFixturesGet } from "#src/resource/ui/demo/resourcePageDemoFixturesGet.ts"

const originalFetch = globalThis.fetch
const originalStorage = globalThis.localStorage
const originalSessionStorage = globalThis.sessionStorage

beforeAll(() => {
  globalThis.fetch = (() => {
    throw new Error("demo attempted network access")
  }) as unknown as typeof fetch
  globalThis.localStorage = {
    getItem: () => null,
    setItem: () => {
      throw new Error("demo attempted storage write")
    },
  } as unknown as Storage
  globalThis.sessionStorage = { getItem: () => null } as unknown as Storage
})
afterAll(() => {
  globalThis.fetch = originalFetch
  globalThis.localStorage = originalStorage
  globalThis.sessionStorage = originalSessionStorage
  pageDemoFixtureStoreGet().clear()
})

describe("resource page demo fixtures", () => {
  test("a submitted add form updates the shared list and linked view without storage or network", async () => {
    const { resourcePageDemoAddStateCreate } = await import("#src/resource/ui/demo/resourcePageDemoAddStateCreate.ts")
    globalThis.localStorage.getItem = () => {
      throw new Error("demo attempted storage read")
    }
    pageDemoFixtureStoreGet().clear()
    const { state, dispose } = createRoot((disposeRoot) => ({
      state: resourcePageDemoAddStateCreate(),
      dispose: disposeRoot,
    }))
    try {
      expect(
        resourcePageDemoFixturesGet()
          .resources()
          .map((r) => r.resourceId),
      ).toEqual(["sample-resource-1"])
      flush()
      state.form.state.name.set("Local example")
      flush()
      state.form.state.description.set("Created only in the page gallery")
      flush()
      await state.form.handleSubmit({ preventDefault() {} } as SubmitEvent)
      const resources = resourcePageDemoFixturesGet()
      flush()
      expect(resources.resources()).toHaveLength(2)
      expect(resources.get("demo-resource-2")?.name).toBe("Local example")
      expect(state.createdHref()).toBe("/demos/resources/demo-resource-2")
    } finally {
      dispose()
    }
  })

  test("new fixture store starts with only the sample and never retains prior additions", () => {
    pageDemoFixtureStoreGet().clear()
    expect(
      resourcePageDemoFixturesGet()
        .resources()
        .map((r) => r.resourceId),
    ).toEqual(["sample-resource-1"])
  })
})
