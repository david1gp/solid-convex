import { describe, expect, test } from "bun:test"
import type { FunctionReference } from "convex/server"
import { createRoot, createSignal, getOwner } from "solid-js"
import * as a from "valibot"
import { createResult } from "#result"
import { ConvexContext } from "./convexContext.ts"
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
  test("moves through cursor history without fetching all pages", async () => {
    const client = new FakeConvexClient()
    let pagination: ReturnType<typeof cursorPaginationCreate<typeof query, string>>
    const dispose = createRoot((disposeRoot) => {
      const owner = getOwner()!
      owner.context = { [ConvexContext.id]: client }
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
    expect(state.page()?.success).toBe(true)
    expect(state.canNext()).toBe(true)

    state.next()
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(state.cursor()).toBe("cursor-1")
    expect(state.canPrevious()).toBe(true)
    expect(client.subscriptions.filter((subscription) => subscription.active)).toHaveLength(1)

    state.previous()
    expect(state.cursor()).toBeNull()
    expect(state.history()).toHaveLength(0)

    dispose()
  })

  test("resets cursor history when query scope changes", async () => {
    const client = new FakeConvexClient()
    const [scope, setScope] = createSignal("one")
    let pagination: ReturnType<typeof cursorPaginationCreate<typeof query, string>> | undefined
    const dispose = createRoot((disposeRoot) => {
      const owner = getOwner()!
      owner.context = { [ConvexContext.id]: client }
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
    pagination!.next()
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
