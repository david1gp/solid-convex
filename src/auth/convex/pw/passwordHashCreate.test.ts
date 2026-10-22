import { expect, test } from "bun:test"
import { passwordHashCreate } from "./passwordHashCreate.js"
import { verifyHashedPassword } from "./verifyHashedPassword.js"

test("produces a consistent hash for a given password and salt", async () => {
  const password = "password123"
  const salt = "test-salt"

  const hash1 = await passwordHashCreate(password, salt)
  const hash2 = await passwordHashCreate(password, salt)

  expect(hash1).toBeDefined()
  expect(hash1).toHaveLength(64) // SHA-256 hex
  expect(hash1).toEqual(hash2)
})

test("accepts the correct password against its hash", async () => {
  const password = "password123"
  const salt = "test-salt"

  const hash = await passwordHashCreate(password, salt)

  const isValid = await verifyHashedPassword(password, hash, salt)

  expect(isValid).toBe(true)
})

test("rejects an incorrect password against the hash", async () => {
  const correctPassword = "password123"
  const wrongPassword = "wrongpassword"
  const salt = "test-salt"

  const hash = await passwordHashCreate(correctPassword, salt)

  const isValid = await verifyHashedPassword(wrongPassword, hash, salt)

  expect(isValid).toBe(false)
})
