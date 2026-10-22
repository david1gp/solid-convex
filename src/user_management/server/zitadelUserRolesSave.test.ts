import { expect, test } from "bun:test"
import type { ZitadelServerConfig } from "#src/user_management/server/zitadelServerConfigSchema.ts"
import { zitadelUserRolesSave } from "#src/user_management/server/zitadelUserRolesSave.ts"

const testConfig: ZitadelServerConfig = {
  baseUrl: "https://auth.example.com",
  token: "test-token-123",
  organizationId: "org-100",
  projectId: "proj-200",
}

function searchResponse(grants: unknown[]) {
  return new Response(JSON.stringify({ result: grants, details: { totalResult: String(grants.length) } }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}

function okResponse() {
  return new Response(JSON.stringify({ details: {} }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}

test("zitadelUserRolesSave PUTs the merged multi-role set preserving unknown keys", async () => {
  let capturedBody: unknown = null
  const requests: string[] = []

  const mockFetch = async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
    if (init?.method === "PUT") {
      requests.push(`${init.method} ${url}`)
      capturedBody = JSON.parse(init.body as string)
      return okResponse()
    }
    return searchResponse([
      {
        id: "grant-multi",
        userId: "user-1",
        projectId: testConfig.projectId,
        orgId: testConfig.organizationId,
        roleKeys: ["user", "auditor"],
        state: 1,
      },
    ])
  }

  const result = await zitadelUserRolesSave({
    config: testConfig,
    userId: "user-1",
    roles: ["admin", "member"],
    fetch: mockFetch,
  })

  expect(result.success).toBe(true)
  if (!result.success) return
  expect(result.data.grantId).toBe("grant-multi")
  expect(result.data.roleKeys).toEqual(["auditor", "admin", "member"])
  expect(capturedBody).toEqual({ roleKeys: ["auditor", "admin", "member"] })
  expect(requests).toHaveLength(1)
})

test("zitadelUserRolesSave reactivates an inactive grant before PUT", async () => {
  const requests: string[] = []
  let capturedBody: unknown = null

  const mockFetch = async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
    const method = init?.method ?? "GET"
    if (url.includes("_reactivate")) {
      requests.push(`POST-reactivate ${url}`)
      return okResponse()
    }
    if (method === "PUT") {
      requests.push(`PUT ${url}`)
      capturedBody = JSON.parse(init?.body as string)
      return okResponse()
    }
    return searchResponse([
      {
        id: "grant-inactive",
        userId: "user-1",
        projectId: testConfig.projectId,
        orgId: testConfig.organizationId,
        roleKeys: ["member"],
        state: 2,
      },
    ])
  }

  const result = await zitadelUserRolesSave({
    config: testConfig,
    userId: "user-1",
    roles: ["admin"],
    fetch: mockFetch,
  })

  expect(result.success).toBe(true)
  if (!result.success) return
  expect(result.data.roleKeys).toEqual(["admin"])
  expect(requests).toHaveLength(2)
  expect(requests[0]).toContain("_reactivate")
  expect(requests[1]?.startsWith("PUT")).toBe(true)
  expect(capturedBody).toEqual({ roleKeys: ["admin"] })
})

test("zitadelUserRolesSave surfaces reactivate failures without writing roles", async () => {
  let putCalls = 0

  const mockFetch = async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
    if (url.includes("_reactivate")) {
      return new Response(JSON.stringify({ message: "gone" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }
    if (init?.method === "PUT") {
      putCalls += 1
      return okResponse()
    }
    return searchResponse([
      {
        id: "grant-inactive",
        userId: "user-1",
        projectId: testConfig.projectId,
        orgId: testConfig.organizationId,
        roleKeys: ["member"],
        state: 2,
      },
    ])
  }

  const result = await zitadelUserRolesSave({
    config: testConfig,
    userId: "user-1",
    roles: ["admin"],
    fetch: mockFetch,
  })

  expect(result.success).toBe(false)
  if (result.success) return
  expect(result.errorMessage).toMatch(/reactivate/i)
  expect(putCalls).toBe(0)
})
