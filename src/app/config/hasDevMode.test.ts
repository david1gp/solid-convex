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

const { hasDevMode } = await import("#src/app/config/hasDevMode.ts")
const { userSessionsSignal } = await import("#src/auth/ui/signals/userSessionsSignal.ts")

const now = new Date().toISOString()
const session = (role: "admin" | "user") => ({
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
})

test("an admin session enables Dev Mode outside development environments", () => {
  const previousEnvMode = process.env.ENV_MODE
  process.env.ENV_MODE = "production"
  try {
    userSessionsSignal.set([session("admin")])
    flush()
    expect(hasDevMode()).toBe(true)

    userSessionsSignal.set([session("user")])
    flush()
    expect(hasDevMode()).toBe(false)
  } finally {
    if (previousEnvMode === undefined) delete process.env.ENV_MODE
    else process.env.ENV_MODE = previousEnvMode
  }
})

test("the development environment gate still enables Dev Mode without an admin session", () => {
  const previousEnvMode = process.env.ENV_MODE
  process.env.ENV_MODE = "development"
  try {
    userSessionsSignal.set([session("user")])
    expect(hasDevMode()).toBe(true)
  } finally {
    if (previousEnvMode === undefined) delete process.env.ENV_MODE
    else process.env.ENV_MODE = previousEnvMode
  }
})
