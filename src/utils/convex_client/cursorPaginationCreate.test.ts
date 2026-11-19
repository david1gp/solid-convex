import { convexContextRootCreate } from "#src/utils/convex_client/test/convexContextRootCreate.ts"
import { describe, expect, test } from "bun:test"
import type { FunctionReference } from "convex/server"
import { createComponent, createSignal, flush } from "solid-js"
import * as a from "valibot"
import { createResult } from "#result"
import { cursorPaginationCreate } from "./cursorPaginationCreate.ts"

type QueryUpdate = (value: unknown) => void

class FakeConvexClient {
  subscriptions: Array<{ args: unknown; update: QueryUpdate; active: boolean }> = []

  onUpdate(_query: unknown, args: unknown, update: QueryUpdate) {
    const subscription = { args, update, active: true }
    this.subscriptions.push(subscription)
    return () => {
      subscription.active = false
    }
  }
}

const query = {} as FunctionReference<"query">

describe("cursorPaginationCreate", () => {
  test("mounts inside a component and tracks changing inputs without diagnostics", () => {
    const client = new FakeConvexClient()
    const [identity, setIdentity] = createSignal("user-1")
    const warnings: string[] = []
    const originalWarn = console.warn
    console.warn = (...args) => warnings.push(args.map(String).join(" "))
    let pagination: ReturnType<typeof cursorPaginationCreate<typeof query, string>> | undefined
    let dispose: (() => void) | undefined
    try {
      dispose = convexContextRootCreate(client, (disposeRoot) => {
        createComponent(() => {
          pagination = cursorPaginationCreate({
            query,
            queryKey: "members",
            args: () => ({ token: identity() }),
            identity,
            itemSchema: a.string(),
            debounceMs: 0,
            storage: new MemoryStorage(),
          })
          return null
        }, {})
        return disposeRoot
      })
      flush()
      client.subscriptions[0]!.update(createResult({ page: ["one"], isDone: true, continueCursor: "" }))
      flush()
      expect(pagination!.page()?.success).toBe(true)
      setIdentity("user-2")
      flush()
      expect(client.subscriptions.at(-1)?.args).toMatchObject({ token: "user-2" })
      expect(warnings.filter((message) => message.includes("STRICT_READ_UNTRACKED"))).toEqual([])
    } finally {
      dispose?.()
      console.warn = originalWarn
    }
  })

  test("moves through cursor history without fetching all pages", async () => {
    const client = new FakeConvexClient()
    let pagination: ReturnType<typeof cursorPaginationCreate<typeof query, string>>
    const dispose = convexContextRootCreate(client, (disposeRoot) => {
      pagination = cursorPaginationCreate({
        query,
        queryKey: "members",
        args: () => ({ token: "secret", orgHandle: "one" }),
        identity: () => "user-1",
        scope: () => "org-one",
        filters: () => ({ role: "member" }),
        itemSchema: a.string(),
        debounceMs: 0,
        storage: new MemoryStorage(),
      })
      return disposeRoot
    })

    await new Promise((resolve) => setTimeout(resolve, 0))
    const state = pagination!
    expect(client.subscriptions).toHaveLength(1)
    client.subscriptions[0]!.update(createResult({ page: ["one"], isDone: false, continueCursor: "cursor-1" }))
    flush()
    expect(state.page()?.success).toBe(true)
    expect(state.canNext()).toBe(true)

    state.next()
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(state.cursor()).toBe("cursor-1")
    expect(state.canPrevious()).toBe(true)
    expect(client.subscriptions.filter((subscription) => subscription.active)).toHaveLength(1)

    state.previous()
    flush()
    expect(state.cursor()).toBeNull()
    expect(state.history()).toHaveLength(0)

    dispose()
  })

  test("resets cursor history when query scope changes", async () => {
    const client = new FakeConvexClient()
    const [scope, setScope] = createSignal("one")
    let pagination: ReturnType<typeof cursorPaginationCreate<typeof query, string>> | undefined
    const dispose = convexContextRootCreate(client, (disposeRoot) => {
      pagination = cursorPaginationCreate({
        query,
        queryKey: "members",
        args: () => ({ token: "secret" }),
        identity: () => "user-1",
        scope,
        itemSchema: a.string(),
        debounceMs: 0,
        storage: new MemoryStorage(),
      })
      return disposeRoot
    })

    await new Promise((resolve) => setTimeout(resolve, 0))
    client.subscriptions[0]!.update(createResult({ page: ["one"], isDone: false, continueCursor: "cursor-1" }))
    flush()
    pagination!.next()
    flush()
    expect(pagination!.history()).toHaveLength(1)
    setScope("two")
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(pagination!.cursor()).toBeNull()
    expect(pagination!.history()).toHaveLength(0)
    dispose()
  })
})

class MemoryStorage implements Storage {
  private values = new Map<string, string>()
  get length() {
    return this.values.size
  }
  clear() {
    this.values.clear()
  }
  getItem(key: string) {
    return this.values.get(key) ?? null
  }
  key(index: number) {
    return [...this.values.keys()][index] ?? null
  }
  removeItem(key: string) {
    this.values.delete(key)
  }
  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}
