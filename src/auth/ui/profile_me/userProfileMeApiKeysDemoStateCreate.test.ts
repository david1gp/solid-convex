import { flush } from "solid-js"
import { afterAll, afterEach, beforeAll, describe, expect, test } from "bun:test"
import { createRoot } from "solid-js"
import { pageDemoFixtureStoreGet } from "#src/app/demos/pageDemoFixtureStoreGet.ts"
import type { ApiKeyListItem } from "#src/auth/model/apiKeyListItemSchema.ts"
import { userProfileMeApiKeysDemoStateCreate } from "./userProfileMeApiKeysDemoStateCreate.ts"

const submit = { preventDefault: () => {} } as SubmitEvent
const originalStorage = globalThis.localStorage
beforeAll(() => {
  globalThis.localStorage = { getItem: () => null } as unknown as Storage
})
afterAll(() => {
  globalThis.localStorage = originalStorage
})
afterEach(() => pageDemoFixtureStoreGet().clear())

describe("API key page demo state", () => {
  test("creates locally with optional expiry, a masked listing and a one-time secret", async () => {
    const originalFetch = globalThis.fetch
    let requests = 0
    globalThis.fetch = (() => {
      requests += 1
      throw new Error("unexpected network call")
    }) as unknown as typeof fetch
    const dispose = createRoot((disposeRoot) => {
      const state = userProfileMeApiKeysDemoStateCreate({ now: () => Date.parse("2026-09-28T10:00:00.000Z") })
      return { state, disposeRoot }
    })
    try {
      const { state } = dispose
      expect(state.page()?.page.map((key) => key.name)).toEqual(["Sample integration", "Retired integration"])
      flush()
      state.nameChange("  ")
      flush()
      await state.create(submit)
      flush()
      expect(state.error()).toContain("Name")
      expect(state.page()?.page).toHaveLength(2)

      flush()
      state.nameChange("  CI key  ")
      flush()
      state.expiryChange("never")
      flush()
      await state.create(submit)
      flush()
      const secret = state.credential()
      flush()
      expect(secret).toStartWith("demo_key_")
      expect(state.page()?.page[0]).toMatchObject({
        name: "CI key",
        status: "active",
        maskedCredential: "dem••••••003",
      })
      expect(state.page()?.page[0]?.expiresAt).toBeUndefined()
      expect(state.page()?.page[0]?.maskedCredential).not.toContain(secret)
      flush()
      state.nameChange("blocked")
      flush()
      await state.create(submit)
      flush()
      expect(state.page()?.page).toHaveLength(3)
      flush()
      state.dismiss()
      flush()
      expect(state.credential()).toBe("")
      expect(state.page()?.page[0]?.maskedCredential).not.toContain(secret)

      flush()
      state.expiryChange("1-day")
      flush()
      state.nameChange("Expiring key")
      flush()
      await state.create(submit)
      flush()
      expect(state.page()?.page[0]?.expiresAt).toBe("2026-09-29T10:00:00.000Z")
      expect(requests).toBe(0)
    } finally {
      dispose.disposeRoot()
      globalThis.fetch = originalFetch
    }
  })

  test("revokes and rotates only active keys, preserving expiry without revealing old secrets", async () => {
    let accept = false
    const { state, dispose } = createRoot((disposeRoot) => ({
      state: userProfileMeApiKeysDemoStateCreate({
        now: () => Date.parse("2026-09-28T12:00:00.000Z"),
        confirm: () => accept,
      }),
      dispose: disposeRoot,
    }))
    try {
      const active = state.page()!.page[0]!
      flush()
      await state.revoke(active)
      flush()
      expect(state.page()!.page[0]!.status).toBe("active")
      accept = true
      flush()
      await state.rotate(active)
      flush()
      expect(state.page()!.page[0]!.name).toBe(active.name)
      expect(state.page()!.page[0]!.id).not.toBe(active.id)
      flush()
      expect(state.page()!.page.find((key) => key.id === active.id)?.status).toBe("revoked")
      const rotatedSecret = state.credential()
      expect(rotatedSecret).toStartWith("demo_key_")
      flush()
      await state.revoke(state.page()!.page[0]!)
      flush()
      expect(state.page()!.page[0]!.status).toBe("active")
      flush()
      state.dismiss()
      flush()
      await state.revoke(state.page()!.page[0]!)
      flush()
      expect(state.page()!.page[0]!.status).toBe("revoked")
      flush()
      await state.rotate(active)
      flush()
      expect(state.credential()).toBe("")
      expect(state.page()!.page).toHaveLength(3)
    } finally {
      dispose()
    }
  })

  test("paginates shared fixtures in memory", async () => {
    const { state, dispose } = createRoot((disposeRoot) => ({
      state: userProfileMeApiKeysDemoStateCreate(),
      dispose: disposeRoot,
    }))
    try {
      for (let i = 0; i < 5; i++) {
        flush()
        state.nameChange(`Key ${i}`)
        flush()
        await state.create(submit)
        flush()
        state.dismiss()
        flush()
      }
      expect(state.pageNumber()).toBe(1)
      flush()
      expect(state.page()?.page).toHaveLength(5)
      expect(state.canNext()).toBe(true)
      flush()
      state.next()
      flush()
      expect(state.pageNumber()).toBe(2)
      expect(state.page()?.page).toHaveLength(2)
      expect(state.canPrevious()).toBe(true)
      flush()
      state.previous()
      flush()
      expect(state.pageNumber()).toBe(1)
    } finally {
      dispose()
    }
  })

  test("clears the current edit and feedback when moving between pages", async () => {
    const { state, dispose } = createRoot((disposeRoot) => ({
      state: userProfileMeApiKeysDemoStateCreate({ confirm: () => true }),
      dispose: disposeRoot,
    }))
    try {
      for (let i = 0; i < 5; i++) {
        flush()
        state.nameChange(`Key ${i}`)
        flush()
        await state.create(submit)
        flush()
        state.dismiss()
        flush()
      }

      const firstPageKey = state.page()!.page[0]!
      flush()
      state.edit(firstPageKey)
      flush()
      state.editNameChange("   ")
      flush()
      await state.saveEdit(submit)
      flush()
      expect(state.editError()).toContain("Name")

      flush()
      state.next()
      flush()
      expect(state.pageNumber()).toBe(2)
      expect(state.editingId()).toBeNull()
      expect(state.editName()).toBe("")
      expect(state.editError()).toBe("")

      const secondPageKey = state.page()!.page[0]!
      expect(secondPageKey.status).toBe("active")
      flush()
      await state.revoke(secondPageKey)
      flush()
      expect(state.page()!.page[0]!.status).toBe("revoked")

      flush()
      state.edit(secondPageKey)
      flush()
      state.editNameChange("   ")
      flush()
      await state.saveEdit(submit)
      flush()
      expect(state.editError()).toContain("Name")
      flush()
      state.previous()
      flush()
      expect(state.editingId()).toBeNull()
      expect(state.editName()).toBe("")
      expect(state.editError()).toBe("")

      flush()
      state.edit(firstPageKey)
      flush()
      state.editNameChange("   ")
      flush()
      await state.saveEdit(submit)
      flush()
      expect(state.editError()).toContain("Name")
      flush()
      state.next()
      flush()
      expect(state.editingId()).toBeNull()
      expect(state.editName()).toBe("")
      expect(state.editError()).toBe("")
    } finally {
      dispose()
    }
  })

  test("preserves key mutations and sequence across remounts without persisting plaintext secrets", async () => {
    const first = createRoot((dispose) => ({
      state: userProfileMeApiKeysDemoStateCreate({ confirm: () => true }),
      dispose,
    }))
    first.state.nameChange("Persistent key")
    flush()
    await first.state.create(submit)
    flush()
    const secret = first.state.credential()
    const createdKey = first.state.page()!.page[0]!
    first.state.dismiss()
    flush()
    await first.state.revoke(createdKey)
    first.dispose()

    const storedFixture = pageDemoFixtureStoreGet().get<{
      get: () => { keys: ApiKeyListItem[]; sequence: number }
    }>("auth:api-keys")!
    flush()
    expect(JSON.stringify(storedFixture.get())).not.toContain(secret)

    const second = createRoot((dispose) => ({ state: userProfileMeApiKeysDemoStateCreate(), dispose }))
    try {
      expect(second.state.credential()).toBe("")
      expect(second.state.page()!.page.find((key) => key.id === createdKey.id)?.status).toBe("revoked")
      second.state.nameChange("Next key")
      flush()
      await second.state.create(submit)
      flush()
      expect(String(second.state.page()!.page[0]!.id)).toBe("demo-key-4")
      expect(second.state.credential()).not.toBe(secret)
    } finally {
      second.dispose()
    }
  })

  test("treats elapsed expiry as expired and rejects rotation or revocation", async () => {
    let now = Date.parse("2026-09-28T10:00:00.000Z")
    const { state, dispose } = createRoot((disposeRoot) => ({
      state: userProfileMeApiKeysDemoStateCreate({ now: () => now, confirm: () => true }),
      dispose: disposeRoot,
    }))
    try {
      flush()
      state.nameChange("Short-lived")
      flush()
      state.expiryChange("1-day")
      flush()
      await state.create(submit)
      flush()
      state.dismiss()
      flush()
      const key = state.page()!.page[0]!
      now += 2 * 24 * 60 * 60 * 1000
      flush()
      expect(state.page()!.page[0]!.status).toBe("expired")
      flush()
      await state.rotate(key)
      flush()
      await state.revoke(key)
      flush()
      expect(state.page()!.page).toHaveLength(3)
      expect(state.credential()).toBe("")
    } finally {
      dispose()
    }
  })

  test("edits active, revoked and expired names locally, validates input and preserves metadata across remounts", async () => {
    const originalFetch = globalThis.fetch
    let requests = 0
    globalThis.fetch = (() => {
      requests += 1
      throw new Error("unexpected network call")
    }) as unknown as typeof fetch
    let now = Date.parse("2026-09-28T10:00:00.000Z")
    const first = createRoot((dispose) => ({ state: userProfileMeApiKeysDemoStateCreate({ now: () => now }), dispose }))
    try {
      const { state } = first
      const active = state.page()!.page[0]!
      const revoked = state.page()!.page[1]!
      flush()
      state.edit(active)
      flush()
      state.editNameChange("Discarded")
      flush()
      state.cancelEdit()
      flush()
      expect(state.editingId()).toBeNull()
      expect(state.page()!.page[0]).toEqual(active)

      flush()
      state.edit(active)
      flush()
      state.editNameChange("   ")
      flush()
      await state.saveEdit(submit)
      flush()
      expect(state.editError()).toContain("Name")
      flush()
      state.editNameChange("x".repeat(81))
      flush()
      await state.saveEdit(submit)
      flush()
      expect(state.editError()).toContain("Name")
      expect(state.page()!.page[0]).toEqual(active)
      flush()
      state.cancelEdit()
      flush()
      expect(state.editError()).toBe("")
      expect(state.editName()).toBe("")

      flush()
      state.edit(active)
      flush()
      state.editNameChange("  Renamed integration  ")
      flush()
      await state.saveEdit(submit)
      flush()
      expect(state.editingId()).toBeNull()
      expect(state.editError()).toBe("")
      expect(state.page()!.page[0]).toEqual({ ...active, name: "Renamed integration" })

      flush()
      state.edit(revoked)
      flush()
      state.editNameChange("Retired renamed")
      flush()
      await state.saveEdit(submit)
      flush()
      expect(state.page()!.page[1]).toEqual({ ...revoked, name: "Retired renamed" })

      flush()
      state.nameChange("Short lived")
      flush()
      state.expiryChange("1-day")
      flush()
      await state.create(submit)
      flush()
      state.dismiss()
      flush()
      now += 2 * 24 * 60 * 60 * 1000
      const expired = state.page()!.page[0]!
      expect(expired.status).toBe("expired")
      flush()
      state.edit(expired)
      flush()
      state.editNameChange("Expired renamed")
      flush()
      await state.saveEdit(submit)
      flush()
      expect(state.page()!.page[0]).toEqual({ ...expired, name: "Expired renamed" })

      first.dispose()
      const second = createRoot((dispose) => ({
        state: userProfileMeApiKeysDemoStateCreate({ now: () => now }),
        dispose,
      }))
      try {
        expect(second.state.page()!.page.map((key) => key.name)).toEqual([
          "Expired renamed",
          "Renamed integration",
          "Retired renamed",
        ])
        expect(second.state.credential()).toBe("")
        expect(
          JSON.stringify(pageDemoFixtureStoreGet().get<{ get: () => unknown }>("auth:api-keys")!.get()),
        ).not.toContain("demo_key_")
        expect(requests).toBe(0)
      } finally {
        second.dispose()
      }
    } finally {
      first.dispose()
      globalThis.fetch = originalFetch
    }
  })
})
