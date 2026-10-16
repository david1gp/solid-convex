import { expect, test } from "vitest"
import { apiKeyCredentialGenerate } from "#src/auth/model/apiKeyCredentialGenerate.ts"
import { apiKeyCredentialHash } from "#src/auth/model/apiKeyCredentialHash.ts"
import { createToken } from "#src/auth/server/jwt_token/createToken.ts"
import { mcpHttpHandler } from "#src/mcp/mcpHttpHandler.ts"
import { authCredentialResolve } from "#src/utils/convex_backend/authCredentialResolve.ts"

const authSecret = "mcp-test-auth-secret"

function jsonRpc(method: string, params?: unknown) {
  return { jsonrpc: "2.0", id: 1, method, ...(params === undefined ? {} : { params }) }
}

async function setup() {
  process.env.AUTH_SECRET = authSecret
  const userId = "mcp-test-user"
  const apiKey = apiKeyCredentialGenerate().credential
  const apiKeyDigest = await apiKeyCredentialHash(apiKey)
  const jwt = await createToken(userId, authSecret)
  const calls: string[] = []
  const ctx = {
    runQuery: async (_reference: unknown, args: Record<string, unknown>) => {
      if ("credential" in args) {
        const credential = args.credential as string
        const authCtx = {
          db: {
            query: () => ({
              withIndex: (
                _name: string,
                callback: (query: { eq: (field: string, value: string) => unknown }) => unknown,
              ) => {
                callback({ eq: (_field, digest) => digest })
                return {
                  unique: async () => (credential === apiKey ? { userId, digest: apiKeyDigest } : null),
                }
              },
            }),
            get: async () => ({ _id: userId }),
          },
        }
        return authCredentialResolve(authCtx as never, credential)
      }
      calls.push("query")
      return { success: true, data: { page: [] } }
    },
    runMutation: async () => {
      calls.push("mutation")
      return { success: true, data: { id: "created" } }
    },
  }
  const post = (token: string | undefined, body: unknown) =>
    mcpHttpHandler(
      ctx as never,
      new Request("https://example.test/mcp", {
        method: "POST",
        headers: {
          accept: "application/json, text/event-stream",
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      }),
    )

  return { post, calls, apiKey, jwt }
}

test("MCP rejects missing and invalid Bearer credentials", async () => {
  const { post } = await setup()
  for (const token of [undefined, "not-a-valid-token"]) {
    const response = await post(
      token,
      jsonRpc("initialize", {
        protocolVersion: "2025-03-26",
        capabilities: {},
        clientInfo: { name: "test", version: "1" },
      }),
    )
    expect(response.status).toBe(401)
  }
})

test("MCP accepts API-key and JWT Bearer credentials", async () => {
  const { post, apiKey, jwt } = await setup()
  for (const token of [apiKey, jwt]) {
    const response = await post(
      token,
      jsonRpc("initialize", {
        protocolVersion: "2025-03-26",
        capabilities: {},
        clientInfo: { name: "test", version: "1" },
      }),
    )
    expect(response.status).toBe(200)
    expect(response.headers.get("mcp-session-id")).toBeNull()
    expect(response.headers.get("content-type")).toContain("application/json")
    expect(await response.json()).toMatchObject({ result: { serverInfo: { name: "solid-convex" } } })
  }
})

test("MCP read and write tools succeed with a valid credential", async () => {
  const { post, calls, apiKey } = await setup()
  const readResponse = await post(apiKey, jsonRpc("tools/call", { name: "org-list", arguments: {} }))
  expect(readResponse.status).toBe(200)
  expect((await readResponse.json()).result.isError).not.toBe(true)

  const writeResponse = await post(
    apiKey,
    jsonRpc("tools/call", {
      name: "note-create",
      arguments: {
        projectId: "project-id",
        content: "MCP test note",
      },
    }),
  )
  expect(writeResponse.status).toBe(200)
  expect((await writeResponse.json()).result.isError).not.toBe(true)
  expect(calls).toEqual(["query", "mutation"])
})
