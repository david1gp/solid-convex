import { expect, test } from "bun:test"
import { passwordHash2 } from "./passwordHash2.js"
import { verifyHashedPassword2 } from "./verifyHashedPassword.js"

test("returns an error when AUTH_SECRET is not defined", async () => {
  delete process.env.AUTH_SECRET

  const result = await passwordHash2("password123")

  expect(result.success).toBe(false)
})

test("returns a verification error when AUTH_SECRET is not defined", async () => {
  delete process.env.AUTH_SECRET

  const result = await verifyHashedPassword2("password123", "somehash")

  expect(result.success).toBe(false)
})

test("produces a hash when AUTH_SECRET is defined", async () => {
  const password = "password123"
  const salt = "test-salt"
  process.env.AUTH_SECRET = salt

  const result = await passwordHash2(password)

  expect(result.success).toBe(true)
  if (result.success) {
    expect(result.data).toHaveLength(64)
  }
})

test("verifies the correct password and hash", async () => {
  const password = "password123"
  const salt = "test-salt"
  process.env.AUTH_SECRET = salt

  const result1 = await passwordHash2(password)
  expect(result1.success).toBe(true)
  if (result1.success) {
    const hash = result1.data

    const result2 = await verifyHashedPassword2(password, hash)

    expect(result2.success).toBe(true)
    if (result2.success) {
      expect(result2.data).toBe(true)
    }
  }
})

test("rejects an incorrect password against the hash", async () => {
  const correctPassword = "password123"
  const wrongPassword = "wrongpassword"
  const salt = "test-salt"
  process.env.AUTH_SECRET = salt

  const result1 = await passwordHash2(correctPassword)
  expect(result1.success).toBe(true)
  if (result1.success) {
    const hash = result1.data

    const result2 = await verifyHashedPassword2(wrongPassword, hash)

    expect(result2.success).toBe(true)
    if (result2.success) {
      expect(result2.data).toBe(false)
    }
  }
})
