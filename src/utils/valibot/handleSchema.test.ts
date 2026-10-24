import { expect, test } from "bun:test"
import * as a from "valibot"
import { handleSchema } from "./handleSchema.js"

test("accepts well-formed handles", () => {
  const validHandles = ["abcde", "hello-world", "test-123", "my-handle-example", "my-name-1"]
  validHandles.forEach((handle) => {
    const result = a.safeParse(handleSchema, handle)
    if (result.success) console.error("wrongly classified ", handle, "as invalid")
    expect(result.success).toBe(true)
  })
})

test("rejects short, malformed, uppercase, and emoji handles", () => {
  const invalidHandles = ["wr", "-wrong", "wrong-", "w--rong", "Wrong", "emoji🚀"]
  invalidHandles.forEach((handle) => {
    const result = a.safeParse(handleSchema, handle)
    if (result.success) console.error("wrongly classified ", handle, "as valid")
    expect(result.success).toBe(false)
  })
})
