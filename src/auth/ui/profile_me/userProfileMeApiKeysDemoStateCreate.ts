import { onCleanup } from "solid-js"
import * as a from "valibot"
import { pageDemoFixtureStoreGet } from "#src/app/demos/pageDemoFixtureStoreGet.ts"
import { ttc } from "#src/app/i18n/ttc.ts"
import { apiKeyCredentialMask } from "#src/auth/model/apiKeyCredentialMask.ts"
import { apiKeyExpiresAtCreate } from "#src/auth/model/apiKeyExpiresAtCreate.ts"
import { type ApiKeyExpiryPreset, apiKeyExpiryPresetSchema } from "#src/auth/model/apiKeyExpiryPreset.ts"
import type { ApiKeyListItem } from "#src/auth/model/apiKeyListItemSchema.ts"
import { apiKeyNameSchema } from "#src/auth/model/apiKeyNameSchema.ts"
import type { userProfileMeApiKeysPageStateCreate } from "#src/auth/ui/profile_me/userProfileMeApiKeysPageStateCreate.ts"
import { toastAdd } from "#ui/interactive/toast/toastAdd.ts"
import { toastVariant } from "#ui/interactive/toast/toastVariant.ts"
import { createSignalObject } from "#ui/utils/createSignalObject.ts"

const fixtureKey = "auth:api-keys"

type ApiKeyDemoFixture = { keys: ApiKeyListItem[]; sequence: number }

/** Shared in-memory sample state. No credential is accepted by the real API. */
export function userProfileMeApiKeysDemoStateCreate(
  options: { now?: () => number; confirm?: (message: string) => boolean } = {},
): ReturnType<typeof userProfileMeApiKeysPageStateCreate> {
  const now = options.now ?? Date.now
  const confirm = options.confirm ?? ((message: string) => window.confirm(message))
  const store = pageDemoFixtureStoreGet()
  let fixture = store.get<ReturnType<typeof createSignalObject<ApiKeyDemoFixture>>>(fixtureKey)
  if (!fixture) {
    fixture = createSignalObject<ApiKeyDemoFixture>({
      keys: [
        {
          id: "demo-key-1" as ApiKeyListItem["id"],
          name: "Sample integration",
          maskedCredential: apiKeyCredentialMask("dem", "001"),
          createdAt: "2026-09-28T09:00:00.000Z",
          status: "active",
        },
        {
          id: "demo-key-2" as ApiKeyListItem["id"],
          name: "Retired integration",
          maskedCredential: apiKeyCredentialMask("dem", "002"),
          createdAt: "2026-09-27T09:00:00.000Z",
          revokedAt: "2026-09-28T09:00:00.000Z",
          status: "revoked",
        },
      ],
      sequence: 2,
    })
    store.set(fixtureKey, fixture)
  }
  const sharedFixture = fixture
  const name = createSignalObject("")
  const expiryPreset = createSignalObject<ApiKeyExpiryPreset>("1-month")
  const credential = createSignalObject("")
  const error = createSignalObject("")
  const editingId = createSignalObject<ApiKeyListItem["id"] | null>(null)
  const editName = createSignalObject("")
  const editError = createSignalObject("")
  const pageIndex = createSignalObject(0)
  const pageSize = 5

  onCleanup(() => credential.set(""))

  const page = () => {
    const offset = pageIndex.get() * pageSize
    return {
      page: sharedFixture
        .get()
        .keys.slice(offset, offset + pageSize)
        .map((key) =>
          key.status === "active" && key.expiresAt && Date.parse(key.expiresAt) <= now()
            ? { ...key, status: "expired" as const }
            : key,
        ),
      isDone: offset + pageSize >= sharedFixture.get().keys.length,
      continueCursor: String(offset + pageSize),
    }
  }

  function issueKey(keyName: string, expiresAt?: string, previous = sharedFixture.get()) {
    const sequence = previous.sequence + 1
    const suffix = String(sequence).padStart(3, "0")
    const id = `demo-key-${sequence}` as ApiKeyListItem["id"]
    const secret = `demo_key_${suffix}_sample_only_${suffix}`
    sharedFixture.set({
      sequence,
      keys: [
        {
          id,
          name: keyName,
          maskedCredential: apiKeyCredentialMask("dem", suffix),
          createdAt: new Date(now()).toISOString(),
          ...(expiresAt && { expiresAt }),
          status: "active",
        },
        ...previous.keys,
      ],
    })
    pageIndex.set(0)
    credential.set(secret)
  }

  function keyIsActive(id: ApiKeyListItem["id"]) {
    return sharedFixture
      .get()
      .keys.some(
        (key) => key.id === id && key.status === "active" && (!key.expiresAt || Date.parse(key.expiresAt) > now()),
      )
  }

  function edit(key: ApiKeyListItem) {
    if (credential.get()) return
    editingId.set(key.id)
    editName.set(key.name)
    editError.set("")
  }

  function cancelEdit() {
    editingId.set(null)
    editName.set("")
    editError.set("")
  }

  async function saveEdit(event: SubmitEvent) {
    event.preventDefault()
    const id = editingId.get()
    if (!id || credential.get()) return
    const parsed = a.safeParse(apiKeyNameSchema, editName.get())
    if (!parsed.success) {
      editError.set(ttc("Name must be 1–80 characters"))
      return
    }
    if (!sharedFixture.get().keys.some((key) => key.id === id)) {
      editError.set(ttc("Could not rename API key. Please try again."))
      return
    }
    sharedFixture.set({
      ...sharedFixture.get(),
      keys: sharedFixture.get().keys.map((key) => (key.id === id ? { ...key, name: parsed.output } : key)),
    })
    cancelEdit()
  }

  async function create(event: SubmitEvent) {
    event.preventDefault()
    if (credential.get()) return
    const parsed = a.safeParse(apiKeyNameSchema, name.get())
    if (!parsed.success) {
      error.set(ttc("Name must be 1–80 characters"))
      return
    }
    error.set("")
    issueKey(parsed.output, apiKeyExpiresAtCreate(expiryPreset.get(), now()))
    name.set("")
  }

  async function revoke(key: ApiKeyListItem) {
    if (credential.get() || editingId.get() === key.id || !keyIsActive(key.id)) return
    if (!confirm(ttc("Revoke this API key? This cannot be undone."))) return
    sharedFixture.set({
      ...sharedFixture.get(),
      keys: sharedFixture
        .get()
        .keys.map((item) =>
          item.id === key.id ? { ...item, revokedAt: new Date(now()).toISOString(), status: "revoked" } : item,
        ),
    })
    error.set("")
  }

  async function rotate(key: ApiKeyListItem) {
    if (credential.get() || editingId.get() === key.id || !keyIsActive(key.id)) return
    if (!confirm(ttc("Rotate this API key? The old credential will stop working immediately."))) return
    const previous = sharedFixture.get()
    issueKey(key.name, key.expiresAt, {
      ...previous,
      keys: previous.keys.map((item) =>
        item.id === key.id ? { ...item, revokedAt: new Date(now()).toISOString(), status: "revoked" } : item,
      ),
    })
    error.set("")
  }

  async function copy() {
    const value = credential.get()
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      toastAdd({ title: ttc("API key copied"), variant: toastVariant.success })
    } catch {
      toastAdd({ title: ttc("Could not copy API key"), variant: toastVariant.error })
    }
  }

  return {
    pageNumber: () => pageIndex.get() + 1,
    canPrevious: () => pageIndex.get() > 0,
    canNext: () => !page().isDone,
    previous: () => {
      cancelEdit()
      pageIndex.set(Math.max(0, pageIndex.get() - 1))
    },
    next: () => {
      if (page().isDone) return
      cancelEdit()
      pageIndex.set(pageIndex.get() + 1)
    },
    loading: () => false,
    page,
    listError: () => "",
    name: name.get,
    nameChange: name.set,
    expiryPreset: expiryPreset.get,
    expiryChange: (value: string) => {
      const parsed = a.safeParse(apiKeyExpiryPresetSchema, value)
      if (parsed.success) expiryPreset.set(parsed.output)
    },
    credential: credential.get,
    dismiss: () => credential.set(""),
    busy: () => false,
    error: error.get,
    editingId: editingId.get,
    editName: editName.get,
    editNameChange: editName.set,
    editError: editError.get,
    edit,
    cancelEdit,
    saveEdit,
    create,
    revoke,
    rotate,
    copy,
  }
}
