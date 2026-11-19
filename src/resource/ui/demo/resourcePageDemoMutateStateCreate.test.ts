import { flush } from "solid-js"
import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { createRoot } from "solid-js"
import { pageDemoFixtureStoreGet } from "#src/app/demos/pageDemoFixtureStoreGet.ts"
import { pageRouteInventory } from "#src/app/demos/pageRouteInventory.ts"
import { resourcePageDemoFixturesGet } from "#src/resource/ui/demo/resourcePageDemoFixturesGet.ts"

const originalFetch = globalThis.fetch
const originalStorage = globalThis.localStorage
const originalSessionStorage = globalThis.sessionStorage

beforeAll(() => {
  globalThis.fetch = (() => {
    throw new Error("resource demo attempted network access")
  }) as unknown as typeof fetch
  globalThis.localStorage = {
    getItem: () => null,
    setItem: () => {
      throw new Error("resource demo attempted storage write")
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

describe("resource page demo edit and remove", () => {
  test("the representative detail, edit, and remove route params resolve the seeded resource", () => {
    pageDemoFixtureStoreGet().clear()
    const fixtures = resourcePageDemoFixturesGet()
    const resourceRoutes = pageRouteInventory.filter((route) => route.route.startsWith("/resources/:resourceId"))

    expect(resourceRoutes).toHaveLength(3)
    for (const route of resourceRoutes) {
      if (!("resourceId" in route.params)) {
        throw new Error(`Expected resource route params for ${route.route}`)
      }

      expect(fixtures.get(route.params.resourceId)?.name).toBe("Sample resource")
    }
  })

  test("editing updates the shared fixture locally and keeps it available to the view and list demos", async () => {
    const { resourcePageDemoEditStateCreate } = await import("#src/resource/ui/demo/resourcePageDemoEditStateCreate.ts")
    pageDemoFixtureStoreGet().clear()
    const { state, dispose } = createRoot((disposeRoot) => ({
      state: resourcePageDemoEditStateCreate("sample-resource-1"),
      dispose: disposeRoot,
    }))
    try {
      flush()
      expect(state.form.state.name.get()).toBe("Sample resource")
      flush()
      state.form.state.name.set("Updated sample resource")
      flush()
      await state.form.handleSubmit({ preventDefault() {} } as SubmitEvent)
      flush()
      expect(state.saved()).toBe(true)
      expect(resourcePageDemoFixturesGet().get("sample-resource-1")?.name).toBe("Updated sample resource")
      expect(resourcePageDemoFixturesGet().resources()).toHaveLength(1)
    } finally {
      dispose()
    }
  })

  test("removing updates the same fixture collection without network or browser storage", async () => {
    const { resourcePageDemoRemoveStateCreate } = await import(
      "#src/resource/ui/demo/resourcePageDemoRemoveStateCreate.ts"
    )
    pageDemoFixtureStoreGet().clear()
    const { state, dispose } = createRoot((disposeRoot) => ({
      state: resourcePageDemoRemoveStateCreate("sample-resource-1"),
      dispose: disposeRoot,
    }))
    try {
      flush()
      expect(state.form.state.name.get()).toBe("Sample resource")
      flush()
      await state.form.handleSubmit({ preventDefault() {} } as SubmitEvent)
      expect(state.removed()).toBe(true)
      expect(resourcePageDemoFixturesGet().get("sample-resource-1")).toBeUndefined()
      expect(resourcePageDemoFixturesGet().resources()).toEqual([])
    } finally {
      dispose()
    }
  })
})
