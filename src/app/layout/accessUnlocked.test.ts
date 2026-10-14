import { expect, test } from "bun:test"
import { accessUnlocked } from "#src/app/layout/accessUnlocked.ts"
import type { UserSession } from "#src/auth/model/UserSession.ts"

const sessionBase = {
  token: "session-token",
  profile: {
    userId: "user-id",
    name: "Test User",
    role: "user" as const,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  hasPw: false,
  signedInMethod: "email" as const,
  signedInAt: "2026-01-01T00:00:00.000Z",
  expiresAt: "2027-01-01T00:00:00.000Z",
} satisfies UserSession

test("an admin session unlocks privileged access without organization membership", () => {
  expect(accessUnlocked({ ...sessionBase, profile: { ...sessionBase.profile, role: "admin" } })).toBe(true)
})

test("an authenticated user session is unlocked without organization membership", () => {
  expect(accessUnlocked({ ...sessionBase, profile: { ...sessionBase.profile, role: "user" } })).toBe(true)
  expect(
    accessUnlocked({
      ...sessionBase,
      profile: { ...sessionBase.profile, role: "user", orgHandle: "acme", orgRole: "member" },
    }),
  ).toBe(true)
})

test("an unauthenticated session is not unlocked", () => {
  expect(accessUnlocked(null)).toBe(false)
  expect(accessUnlocked(undefined)).toBe(false)
})
