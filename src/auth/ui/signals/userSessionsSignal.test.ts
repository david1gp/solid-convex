import { flush } from "solid-js"
import { expect, test } from "bun:test"

const storage = new Map<string, string>()
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  },
})
Object.defineProperty(globalThis, "sessionStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  },
})

const { autoLoginIfUserRoleOnly } = await import("#src/auth/ui/signals/userSessionSignal.ts")
const { userSessionsSignal } = await import("#src/auth/ui/signals/userSessionsSignal.ts")

const now = new Date().toISOString()

function session(role: "admin" | "user") {
  return {
    token: `${role}-token`,
    profile: {
      userId: `${role}-user`,
      name: role,
      role,
      createdAt: now,
      updatedAt: now,
    },
    hasPw: false,
    signedInMethod: "admin" as const,
    signedInAt: now,
    expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
  }
}

test("admin sessions remain selectable but are excluded from single-user auto-login", () => {
  userSessionsSignal.set([session("admin")])
  expect(autoLoginIfUserRoleOnly()).toBe(null)

  userSessionsSignal.set([session("user")])
  flush()
  expect(autoLoginIfUserRoleOnly()?.profile.role).toBe("user")
})
