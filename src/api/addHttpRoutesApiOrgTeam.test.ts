import { describe, expect, test } from "bun:test"
import type { ActionCtx } from "#convex/_generated/server.js"
import { addHttpRoutesApiOrgTeam } from "#src/api/addHttpRoutesApiOrgTeam.ts"
import { createHonoDispatcher } from "#src/auth/convex/headers/createHonoDispatcher.ts"

describe("org/team HTTP API authentication", () => {
  test("returns 401 for a missing Bearer credential", async () => {
    const dispatcher = addHttpRoutesApiOrgTeam(createHonoDispatcher())
    const response = await dispatcher.fetch(new Request("https://example.test/api/orgs"), {} as ActionCtx)
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({
      error: {
        code: "api-org-team.unauthorized",
        message: "Unauthorized",
        op: "apiOrgTeam:org-list",
        status: 401,
        requestId: expect.any(String),
        retryable: false,
      },
    })
  })

  test("lists organizations after resolving a Bearer credential", async () => {
    const dispatcher = addHttpRoutesApiOrgTeam(createHonoDispatcher())
    const mockCtx = {
      runQuery: async (_reference: unknown, args: { credential?: string; token?: string }) => {
        if (args.credential) return { success: true, data: { kind: "jwt", userId: "user-1" } }
        expect(args.token).toBe("valid-token")
        return { success: true, data: [{ orgHandle: "example" }] }
      },
    }
    const response = await dispatcher.fetch(
      new Request("https://example.test/api/orgs", { headers: { authorization: "Bearer valid-token" } }),
      mockCtx as ActionCtx,
    )
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true, data: [{ orgHandle: "example" }] })
  })
})
