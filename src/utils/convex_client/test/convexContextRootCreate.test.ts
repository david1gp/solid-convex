import { expect, test } from "bun:test"
import type { ConvexClient } from "convex/browser"
import { createRenderEffect, createSignal, flush, getOwner, useContext } from "solid-js"
import { ConvexContext } from "../convexContext.ts"
import { convexContextRootCreate } from "./convexContextRootCreate.ts"

test("provides the client to children and returns the callback result", () => {
  const client = {} as ConvexClient
  let setValue!: (value: number) => number
  const seen: number[] = []
  const dispose = convexContextRootCreate(client, (disposeRoot) => {
    expect(useContext(ConvexContext)).toBe(client)
    const [value, set] = createSignal(0)
    setValue = set
    createRenderEffect(value, (next) => {
      seen.push(next)
    })
    return disposeRoot
  })
  expect(getOwner()).toBeNull()
  setValue(1)
  flush()
  expect(seen).toEqual([0, 1])
  dispose()
})
