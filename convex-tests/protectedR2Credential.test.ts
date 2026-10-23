import { convexTest } from "convex-test"
import { expect, test, vi } from "vitest"
import { internal } from "../convex/_generated/api.js"
import type { ActionCtx } from "../convex/_generated/server.js"
import schema from "../convex/schema.js"
import { apiKeyCredentialHash } from "../src/auth/model/apiKeyCredentialHash.ts"
import { tokenCreate } from "../src/auth/server/jwt_token/tokenCreate.ts"
import { r2FileCreateHttpHandler } from "../src/r2/convex/r2FileCreateHttpHandler.ts"
import { r2UploadUrlGetHttpHandler } from "../src/r2/convex/r2UploadUrlGetHttpHandler.ts"

vi.mock("../src/r2/api_r2/r2ApiGetUploadUrl.ts", () => ({
  r2ApiGetUploadUrl: vi.fn(async () => ({ success: true, data: "https://files.test/upload" })),
}))

const modules = import.meta.glob("../convex/**/*.ts")

test.each([
  ["raw JWT", false, false],
  ["Bearer JWT", true, false],
  ["raw API key", false, true],
  ["Bearer API key", true, true],
])("R2 file creation passes %s credentials through shared resolution", async (_label, bearer, apiKey) => {
  const t = convexTest(schema, modules)
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error("AUTH_SECRET is required for R2 credential tests")
  const userId = await t.run(async (ctx) => {
    const createdAt = new Date().toISOString()
    return ctx.db.insert("users", {
      name: "Credential owner",
      username: "owner",
      role: "user",
      createdAt,
      updatedAt: createdAt,
    })
  })
  const credential = apiKey ? "a".repeat(64) : await tokenCreate(userId, secret)
  if (apiKey) {
    const digest = await apiKeyCredentialHash(credential)
    await t.run((ctx) =>
      ctx.db.insert("authApiKeys", {
        userId,
        name: "r2 integration",
        digest,
        previewFirst3: credential.slice(0, 3),
        previewLast3: credential.slice(-3),
        createdAt: new Date().toISOString(),
      }),
    )
  }
  const runQuery = vi.fn(async (_reference: unknown, args: { credential?: string; userId?: typeof userId }) => {
    if (args.credential) {
      return t.query(internal.auth.apiKeyCredentialResolveQuery, { credential: args.credential })
    }
    return t.query(internal.auth.userGetInternalQuery, { userId: args.userId! })
  })
  const runMutation = vi.fn(async () => ({ success: true, data: "files:created" }))
  const ctx = { runQuery, runMutation } as unknown as ActionCtx
  const authorization = bearer ? `Bearer ${credential}` : credential
  const request = new Request("https://example.test/fileCreate", {
    method: "POST",
    headers: { authorization, "content-type": "application/json" },
    body: JSON.stringify({
      fileId: "2026-09-28_credential-test",
      url: "https://files.test/document.pdf",
      displayName: "document.pdf",
      fileSize: 12,
      contentType: "application/pdf",
    }),
  })

  const response = await r2FileCreateHttpHandler(ctx, request)

  expect(response.status).toBe(200)
  expect(runQuery.mock.calls[0]?.[1]).toEqual({ credential })
  expect(runMutation.mock.calls[0]?.[1]).toMatchObject({ userId, username: "owner" })

  const uploadUrlRequest = new Request("https://example.test/uploadUrl?fileId=2026-09-28_credential-test", {
    headers: { authorization },
  })
  const uploadUrlResponse = await r2UploadUrlGetHttpHandler(ctx, uploadUrlRequest)
  expect(uploadUrlResponse.status).toBe(200)
  expect(runQuery.mock.calls.at(-1)?.[1]).toEqual({ credential })
})
