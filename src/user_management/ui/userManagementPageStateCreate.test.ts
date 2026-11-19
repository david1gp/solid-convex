import { flush } from "solid-js"
import { convexContextRootCreate } from "#src/utils/convex_client/test/convexContextRootCreate.ts"
import { describe, expect, mock, test } from "bun:test"
import { createResult, createResultError } from "#result"
import type { UserProfile } from "#src/auth/model/UserProfile.ts"
import type { UserSession } from "#src/auth/model/UserSession.ts"

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

import { createRoot, createSignal } from "solid-js"

const [paramsSignal, setParamsSignal] = createSignal<Record<string, string>>({})

mock.module("@tanstack/solid-router", () => ({
  useParams: () => paramsSignal,
  useLocation: () => () => ({ pathname: "/user-management" }),
  useNavigate: () => () => undefined,
}))

const { userSessionSignal } = await import("#src/auth/ui/signals/userSessionSignal.ts")
const { userManagementPageStateCreate } = await import("./userManagementPageStateCreate.ts")
mock.restore()

type QueryUpdate = (value: unknown) => void

class MockConvexClient {
  subscriptions: Array<{ query: unknown; args: unknown; update: QueryUpdate }> = []

  mutation() {
    return Promise.resolve(createResult(true))
  }

  action() {
    return Promise.resolve(createResult({ syncedCount: 0 }))
  }

  onUpdate(query: unknown, args: unknown, update: QueryUpdate) {
    const entry = { query, args, update }
    this.subscriptions.push(entry)
    return () => {
      const idx = this.subscriptions.indexOf(entry)
      if (idx >= 0) this.subscriptions.splice(idx, 1)
    }
  }
}

function adminSessionCreate(): UserSession {
  return {
    token: "test-admin-token",
    profile: {
      userId: "admin-1",
      email: "admin@example.com",
      role: "admin",
      roles: ["admin"],
    } as unknown as UserProfile,
    hasPw: true,
    signedInMethod: "oidc",
    signedInAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  }
}

function nonAdminSessionCreate(): UserSession {
  return {
    token: "test-user-token",
    profile: {
      userId: "user-1",
      email: "user@example.com",
      role: "user",
      roles: ["user"],
    } as unknown as UserProfile,
    hasPw: true,
    signedInMethod: "oidc",
    signedInAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  }
}

describe("userManagementPageStateCreate singleUserQuery skip adoption", () => {
  test("single user query is not subscribed when no user is selected", () => {
    flush()
    userSessionSignal.set(adminSessionCreate())
    flush()
    setParamsSignal({})
    flush()

    const client = new MockConvexClient()
    convexContextRootCreate(client, (dispose) => {
      userManagementPageStateCreate()

      const userProjectionGetSubs = client.subscriptions.filter((s) => {
        const queryArgs = s.args as Record<string, unknown> | undefined
        return queryArgs && "userId" in queryArgs
      })

      expect(userProjectionGetSubs).toHaveLength(0)
      dispose()
    })
  })

  test("single user query is not subscribed when user is non-admin even if userId param is present", () => {
    flush()
    userSessionSignal.set(nonAdminSessionCreate())
    flush()
    setParamsSignal({ userId: "target-user-123" })
    flush()

    const client = new MockConvexClient()
    convexContextRootCreate(client, (dispose) => {
      userManagementPageStateCreate()

      const userProjectionGetSubs = client.subscriptions.filter((s) => {
        const queryArgs = s.args as Record<string, unknown> | undefined
        return queryArgs && "userId" in queryArgs
      })

      expect(userProjectionGetSubs).toHaveLength(0)
      dispose()
    })
  })

  test("single user query is subscribed with userId when admin and userId is selected", () => {
    flush()
    userSessionSignal.set(adminSessionCreate())
    flush()
    setParamsSignal({ userId: "target-user-456" })
    flush()

    const client = new MockConvexClient()
    convexContextRootCreate(client, (dispose) => {
      userManagementPageStateCreate()

      const userProjectionGetSubs = client.subscriptions.filter((s) => {
        const queryArgs = s.args as Record<string, unknown> | undefined
        return queryArgs && "userId" in queryArgs
      })

      expect(userProjectionGetSubs).toHaveLength(1)
      expect(userProjectionGetSubs[0]!.args).toEqual({
        token: "test-admin-token",
        userId: "target-user-456",
      })
      dispose()
    })
  })

  test("single user query subscribes and un-subscribes reactively when selection changes", async () => {
    flush()
    userSessionSignal.set(adminSessionCreate())
    flush()
    setParamsSignal({})
    flush()

    const client = new MockConvexClient()
    await convexContextRootCreate(client, async (dispose) => {
      userManagementPageStateCreate()

      const getSingleSubs = () =>
        client.subscriptions.filter((s) => {
          const queryArgs = s.args as Record<string, unknown> | undefined
          return queryArgs && "userId" in queryArgs
        })

      expect(getSingleSubs()).toHaveLength(0)

      flush()
      setParamsSignal({ userId: "target-user-789" })
      flush()
      await Promise.resolve()
      flush()
      expect(getSingleSubs()).toHaveLength(1)
      expect(getSingleSubs()[0]!.args).toEqual({
        token: "test-admin-token",
        userId: "target-user-789",
      })

      flush()
      setParamsSignal({})
      flush()
      await Promise.resolve()
      expect(getSingleSubs()).toHaveLength(0)

      dispose()
    })
  })
})
