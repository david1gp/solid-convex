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

const solidJsClientPath = "solid-js/dist/solid.js"
type SolidJsModule = typeof import("solid-js")
const solidJsClient = (await import(solidJsClientPath)) as unknown as SolidJsModule
mock.module("solid-js", () => solidJsClient)
const { createRoot, createSignal, getOwner } = solidJsClient

const [paramsSignal, setParamsSignal] = createSignal<Record<string, string>>({
  teamId: "team-123",
  orgHandle: "test-org",
})

mock.module("@tanstack/solid-router", () => ({
  useParams: () => paramsSignal,
  useLocation: () => () => ({ pathname: "/org/test-org/team/team-123" }),
  useNavigate: () => () => undefined,
}))

const { ConvexContext } = await import("#src/utils/convex_client/convexContext.ts")
const { teamDetailPageStateCreate } = await import("./teamDetailPageStateCreate.ts")
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

describe("teamDetailPageStateCreate deleteTarget persistence", () => {
  test("deleteTarget remains stable when team query returns error during lock", () => {
    const client = new MockConvexClient()
    createRoot((dispose) => {
      const owner = getOwner()!
      owner.context = { [ConvexContext.id]: client }

      setParamsSignal({ teamId: "team-123", orgHandle: "test-org" })
      const state = teamDetailPageStateCreate()

      // Target is immediately derived from route IDs even before entity query finishes
      expect(state.deleteTarget()).toEqual({
        kind: "team",
        teamId: "team-123",
      })
      expect(state.team()).toBeUndefined()

      // Simulate lock error during hierarchy deletion
      client.notifyQuery(() => true, createResultError("teamGetFn", "Team is locked for deletion"))

      // Team entity is undefined / errored
      expect(state.team()).toBeUndefined()
      expect(state.error()).toBe("Team is locked for deletion")

      // deleteTarget remains stably available so dialog does not lose target or unmount
      expect(state.deleteTarget()).toEqual({
        kind: "team",
        teamId: "team-123",
      })

      dispose()
    })
  })

  test("resolves loading to false and displays error when backend returns team not found", () => {
    const client = new MockConvexClient()
    createRoot((dispose) => {
      const owner = getOwner()!
      owner.context = { [ConvexContext.id]: client }

      setParamsSignal({ teamId: "malformed-team-id", orgHandle: "test-org" })
      const state = teamDetailPageStateCreate()

      expect(state.loading()).toBe(true)

      client.notifyQuery(
        (args) => (args as Record<string, unknown>).teamId === "malformed-team-id",
        createResultError("teamGetFn", "Team not found"),
      )

      expect(state.loading()).toBe(false)
      expect(state.error()).toBe("Team not found")

      dispose()
    })
  })

  test("skips subscription when team ID parameter is missing and displays param error", () => {
    const client = new MockConvexClient()
    createRoot((dispose) => {
      const owner = getOwner()!
      owner.context = { [ConvexContext.id]: client }

      setParamsSignal({ orgHandle: "test-org" })
      const state = teamDetailPageStateCreate()

      expect(state.loading()).toBe(false)
      expect(state.error()).toBe("Team ID is required")

      // Subscription should be skipped
      const sub = client.subscriptions.find((s) => {
        const a = s.args as Record<string, unknown> | undefined
        return a && "teamId" in a
      })
      expect(sub).toBeUndefined()

      dispose()
    })
  })

  test("resolves loading to false on subscription onError", () => {
    const client = new MockConvexClient()
    createRoot((dispose) => {
      const owner = getOwner()!
      owner.context = { [ConvexContext.id]: client }

      setParamsSignal({ teamId: "team-123", orgHandle: "test-org" })
      const state = teamDetailPageStateCreate()

      expect(state.loading()).toBe(true)

      client.failQuery(() => true, new Error("Convex query failed"))

      expect(state.loading()).toBe(false)
      expect(state.error()).toBe("Convex query failed")

      dispose()
    })
  })
})
