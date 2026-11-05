import { expect, test } from "bun:test"
import { EventEmitter } from "node:events"
import type { BrowserContext, Page } from "playwright"
import { pageErrorGuardCreate } from "./pageErrorGuardCreate.ts"

test("reports errors from existing pages, new pages and popups at teardown", () => {
  const existing = new EventEmitter()
  const added = new EventEmitter()
  const popup = new EventEmitter()
  const context = Object.assign(new EventEmitter(), { pages: () => [existing] })
  const guard = pageErrorGuardCreate(context as unknown as BrowserContext)
  const failures = [new Error("existing"), new Error("new"), new Error("popup")]
  context.emit("page", existing as unknown as Page)
  context.emit("page", added as unknown as Page)
  context.emit("page", popup as unknown as Page)
  existing.emit("pageerror", failures[0])
  added.emit("pageerror", failures[1])
  popup.emit("pageerror", failures[2])

  let caught: unknown
  try {
    guard.finish()
  } catch (error) {
    caught = error
  }
  expect(caught).toBeInstanceOf(AggregateError)
  expect((caught as AggregateError).errors).toEqual(failures)
  expect(context.listenerCount("page")).toBe(0)
  expect(existing.listenerCount("pageerror")).toBe(0)
  expect(added.listenerCount("pageerror")).toBe(0)
  expect(popup.listenerCount("pageerror")).toBe(0)
})

test("finishes without failure when no page errors occurred", () => {
  const context = Object.assign(new EventEmitter(), { pages: () => [] })
  const guard = pageErrorGuardCreate(context as unknown as BrowserContext)
  expect(() => guard.finish()).not.toThrow()
})
