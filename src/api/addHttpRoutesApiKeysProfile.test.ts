import { describe, expect, test } from "bun:test"
import type { ActionCtx } from "#convex/_generated/server.js"
import { addHttpRoutesApiKeysProfile } from "#src/api/addHttpRoutesApiKeysProfile.ts"
import { createHonoDispatcher } from "#src/auth/convex/headers/createHonoDispatcher.ts"

describe("keys/profile HTTP API", () => {
  test("returns 401 when a Bearer credential is missing", async () => {
    const dispatcher = addHttpRoutesApiKeysProfile(createHonoDispatcher())
    const response = await dispatcher.fetch(new Request("https://example.test/api/keys"), {} as ActionCtx)
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({
      error: {
        code: "api-keys.unauthorized",
        message: "Unauthorized",
        op: "apiKeysGet",
        status: 401,
        requestId: expect.any(String),
        retryable: false,
      },
    })
  })

  test("returns the one-time plaintext credential from key creation", async () => {
    const dispatcher = addHttpRoutesApiKeysProfile(createHonoDispatcher())
    const mockCtx = {
      runQuery: async (_reference: unknown, args: { credential?: string }) => {
        expect(args.credential).toBe("valid-token")
        return { success: true, data: { kind: "jwt", userId: "user-1" } }
      },
      runMutation: async (_reference: unknown, args: { token: string; name: string; expiryPreset?: string }) => {
        expect(args).toEqual({ token: "valid-token", name: "CI key", expiryPreset: undefined })
        return { success: true, data: { id: "key-1", credential: "plain-once" } }
      },
    }
    const response = await dispatcher.fetch(
      new Request("https://example.test/api/keys/create", {
        method: "POST",
        headers: { authorization: "Bearer valid-token", "content-type": "application/json" },
        body: JSON.stringify({ name: "CI key" }),
      }),
      mockCtx as ActionCtx,
    )
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true, data: { id: "key-1", credential: "plain-once" } })
  })
})
