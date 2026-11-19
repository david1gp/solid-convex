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

import { createRoot, createSignal } from "solid-js"

const [paramsSignal, setParamsSignal] = createSignal<Record<string, string>>({
  projectId: "proj-456",
  teamId: "team-123",
  orgHandle: "test-org",
})

mock.module("@tanstack/solid-router", () => ({
  useParams: () => paramsSignal,
  useLocation: () => () => ({ pathname: "/org/test-org/team/team-123/project/proj-456" }),
  useNavigate: () => () => undefined,
}))

const { projectDetailPageStateCreate } = await import("./projectDetailPageStateCreate.ts")
mock.restore()

type QueryUpdate = (value: unknown) => void
type QueryError = (error: Error) => void

class MockConvexClient {
  subscriptions: Array<{
    query: unknown
    args: unknown
    update: QueryUpdate
    onError?: QueryError
  }> = []

  mutation() {
    return Promise.resolve(createResult(true))
  }

  onUpdate(query: unknown, args: unknown, update: QueryUpdate, onError?: QueryError) {
    const entry = { query, args, update, onError }
    this.subscriptions.push(entry)
    return () => {
      const idx = this.subscriptions.indexOf(entry)
      if (idx >= 0) this.subscriptions.splice(idx, 1)
    }
  }

  notifyQuery(matcher: (args: unknown) => boolean, value: unknown) {
    for (const sub of this.subscriptions) {
      if (matcher(sub.args)) {
        sub.update(value)
      }
    }
  }

  failQuery(matcher: (args: unknown) => boolean, error: Error) {
    for (const sub of this.subscriptions) {
      if (matcher(sub.args)) {
        sub.onError?.(error)
      }
    }
  }
}

describe("projectDetailPageStateCreate deleteTarget persistence", () => {
  test("deleteTarget remains stable when project query returns error during lock", () => {
    const client = new MockConvexClient()
    convexContextRootCreate(client, (dispose) => {
      setParamsSignal({ projectId: "proj-456", teamId: "team-123", orgHandle: "test-org" })
      const state = projectDetailPageStateCreate()

      // Target is immediately derived from route IDs even before entity query finishes
      expect(state.deleteTarget()).toEqual({
        kind: "project",
        projectId: "proj-456",
      })
      expect(state.project()).toBeUndefined()

      // Simulate lock error during hierarchy deletion
      client.notifyQuery(() => true, createResultError("projectGetFn", "Project is locked for deletion"))

      // Project entity is undefined / errored
      expect(state.project()).toBeUndefined()
      expect(state.error()).toBe("Project is locked for deletion")

      // deleteTarget remains stably available so dialog does not lose target or unmount
      expect(state.deleteTarget()).toEqual({
        kind: "project",
        projectId: "proj-456",
      })

      dispose()
    })
  })

  test("resolves loading to false and displays error when backend returns project not found", () => {
    const client = new MockConvexClient()
    convexContextRootCreate(client, (dispose) => {
      setParamsSignal({ projectId: "malformed-project-id", teamId: "team-123", orgHandle: "test-org" })
      const state = projectDetailPageStateCreate()

      expect(state.loading()).toBe(true)

      client.notifyQuery(
        (args) => (args as Record<string, unknown>).projectId === "malformed-project-id",
        createResultError("projectGetFn", "Project not found"),
      )

      expect(state.loading()).toBe(false)
      expect(state.error()).toBe("Project not found")

      dispose()
    })
  })

  test("skips subscription when project ID parameter is missing and displays param error", () => {
    const client = new MockConvexClient()
    convexContextRootCreate(client, (dispose) => {
      setParamsSignal({ teamId: "team-123", orgHandle: "test-org" })
      const state = projectDetailPageStateCreate()

      expect(state.loading()).toBe(false)
      expect(state.error()).toBe("Project ID is required")

      // Project subscription should be skipped
      const sub = client.subscriptions.find((s) => {
        const a = s.args as Record<string, unknown> | undefined
        return a && "projectId" in a
      })
      expect(sub).toBeUndefined()

      dispose()
    })
  })

  test("skips team ancestor query when no team ID is available", () => {
    const client = new MockConvexClient()
    convexContextRootCreate(client, (dispose) => {
      setParamsSignal({ projectId: "proj-standalone" })
      projectDetailPageStateCreate()

      // teamGetQuery should not be subscribed with empty string
      const emptyTeamSub = client.subscriptions.find((s) => {
        const a = s.args as Record<string, unknown> | undefined
        return a && "teamId" in a && a.teamId === ""
      })
      expect(emptyTeamSub).toBeUndefined()

      dispose()
    })
  })

  test("resolves loading to false on subscription onError", () => {
    const client = new MockConvexClient()
    convexContextRootCreate(client, (dispose) => {
      setParamsSignal({ projectId: "proj-456", teamId: "team-123", orgHandle: "test-org" })
      const state = projectDetailPageStateCreate()

      expect(state.loading()).toBe(true)

      client.failQuery(() => true, new Error("Convex query failed"))

      expect(state.loading()).toBe(false)
      expect(state.error()).toBe("Convex query failed")

      dispose()
    })
  })

  test("initializes tab state with details, exposes tab options, text, and icons", () => {
    const client = new MockConvexClient()
    convexContextRootCreate(client, (dispose) => {
      setParamsSignal({ projectId: "proj-456", teamId: "team-123", orgHandle: "test-org" })
      const state = projectDetailPageStateCreate()

      expect(state.tabOptions()).toEqual(["details", "notes"])
      expect(state.selectedTab.get()).toBe("details")
      expect(state.tabText("details")).toBe("Details")
      expect(state.tabText("notes")).toBe("Notes")
      expect(typeof state.tabIcon("details")).toBe("string")
      expect(typeof state.tabIcon("notes")).toBe("string")
      expect(state.tabIcon("details").length).toBeGreaterThan(0)
      expect(state.tabIcon("notes").length).toBeGreaterThan(0)

      state.selectedTab.set("notes")
      expect(state.selectedTab.get()).toBe("notes")

      dispose()
    })
  })
})
