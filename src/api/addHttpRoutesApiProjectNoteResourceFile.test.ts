import { describe, expect, test } from "bun:test"
import type { ActionCtx } from "#convex/_generated/server.js"
import { addHttpRoutesApiProjectNoteResourceFile } from "#src/api/addHttpRoutesApiProjectNoteResourceFile.ts"
import { createHonoDispatcher } from "#src/auth/convex/headers/createHonoDispatcher.ts"

describe("project/note/resource/file HTTP API", () => {
  test("returns 401 without a Bearer credential", async () => {
    const dispatcher = addHttpRoutesApiProjectNoteResourceFile(createHonoDispatcher())
    const response = await dispatcher.fetch(new Request("https://example.test/api/projects"), {} as ActionCtx)
    expect(response.status).toBe(401)
  })

  test("lists projects with the resolved Bearer token", async () => {
    const dispatcher = addHttpRoutesApiProjectNoteResourceFile(createHonoDispatcher())
    const mockCtx = {
      runQuery: async (_reference: unknown, args: { credential?: string; token?: string }) => {
        if (args.credential) return { success: true, data: { kind: "jwt", userId: "user-1" } }
        expect(args.token).toBe("valid-token")
        return { success: true, data: { page: [], isDone: true, continueCursor: null } }
      },
    }
    const response = await dispatcher.fetch(
      new Request("https://example.test/api/projects", { headers: { authorization: "Bearer valid-token" } }),
      mockCtx as ActionCtx,
    )
    expect(response.status).toBe(200)
    expect((await response.json()).data.page).toEqual([])
  })
})
