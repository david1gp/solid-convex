import { expect, test } from "bun:test"
import { UserService } from "@adaptive-ds/zitadel-cli"
import { createRouterTransport } from "@connectrpc/connect"
import { userRole } from "#src/auth/model_field/userRole.ts"
import { zitadelMetadataTeamIdsKey } from "#src/user_management/server/zitadelMetadataTeamIdsKey.ts"
import type { ZitadelServerConfig } from "#src/user_management/server/zitadelServerConfigSchema.ts"
import { zitadelUserAssignmentSave } from "#src/user_management/server/zitadelUserAssignmentSave.ts"
import { zitadelUserGrantList } from "#src/user_management/server/zitadelUserGrantList.ts"
import { zitadelUserListPaged } from "#src/user_management/server/zitadelUserListPaged.ts"
import { zitadelUserMetadataList } from "#src/user_management/server/zitadelUserMetadataList.ts"
import { zitadelUserRolesSave } from "#src/user_management/server/zitadelUserRolesSave.ts"
import { zitadelUserTeamIdsGet } from "#src/user_management/server/zitadelUserTeamIdsGet.ts"
import { zitadelUserTeamIdsSave } from "#src/user_management/server/zitadelUserTeamIdsSave.ts"

const testConfig: ZitadelServerConfig = {
  baseUrl: "https://auth.example.com",
  token: "test-token-123",
  organizationId: "org-100",
  projectId: "proj-200",
}

test("zitadelUserListPaged queries Zitadel UserService and maps users", async () => {
  let capturedQuery: unknown = null

  const transport = createRouterTransport(({ service }) => {
    service(UserService, {
      async listUsers(req) {
        capturedQuery = req
        return {
          details: { totalResult: 1n },
          result: [
            {
              userId: "user-alpha",
              username: "alpha_user",
              preferredLoginName: "alpha@example.com",
              state: 1,
              type: {
                case: "human",
                value: {
                  profile: { displayName: "Alpha User" },
                  email: { email: "alpha@example.com" },
                },
              },
            },
          ],
        }
      },
    })
  })

  const result = await zitadelUserListPaged({
    config: testConfig,
    limit: 10,
    offset: 0,
    transport,
  })

  expect(result.success).toBe(true)
  if (!result.success) return
  expect(result.data.totalCount).toBe(1)
  expect(result.data.users).toHaveLength(1)
  expect(result.data.users[0]?.id).toBe("user-alpha")
  expect(result.data.users[0]?.displayName).toBe("Alpha User")
  expect(result.data.users[0]?.email).toBe("alpha@example.com")
  expect(capturedQuery).toBeDefined()
})

test("zitadelUserGrantList fetches user grants for project via legacy endpoint", async () => {
  const mockFetch = async () => {
    return new Response(
      JSON.stringify({
        result: [
          {
            id: "grant-1",
            userId: "user-1",
            projectId: testConfig.projectId,
            orgId: testConfig.organizationId,
            roleKeys: ["contributor", "admin"],
            state: 1,
          },
        ],
        details: { totalResult: "1" },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )
  }

  const result = await zitadelUserGrantList({
    config: testConfig,
    userId: "user-1",
    fetch: mockFetch,
  })

  expect(result.success).toBe(true)
  if (!result.success) return
  expect(result.data).toHaveLength(1)
  expect(result.data[0]?.id).toBe("grant-1")
  expect(result.data[0]?.roleKeys).toEqual(["contributor", "admin"])
})

test("zitadelUserMetadataList and zitadelUserTeamIdsGet retrieve and decode team IDs", async () => {
  const teamBytes = new TextEncoder().encode(JSON.stringify(["team-x", "team-y"]))

  const transport = createRouterTransport(({ service }) => {
    service(UserService, {
      async listUserMetadata(req) {
        expect(req.userId).toBe("user-test")
        return {
          metadata: [
            {
              key: zitadelMetadataTeamIdsKey,
              value: teamBytes,
            },
          ],
        }
      },
    })
  })

  const metadataListResult = await zitadelUserMetadataList({
    config: testConfig,
    userId: "user-test",
    transport,
  })
  expect(metadataListResult.success).toBe(true)
  if (!metadataListResult.success) return
  expect(metadataListResult.data).toHaveLength(1)
  expect(metadataListResult.data[0]?.key).toBe(zitadelMetadataTeamIdsKey)

  const teamIdsResult = await zitadelUserTeamIdsGet({
    config: testConfig,
    userId: "user-test",
    transport,
  })
  expect(teamIdsResult.success).toBe(true)
  if (!teamIdsResult.success) return
  expect(teamIdsResult.data).toEqual(["team-x", "team-y"])
})

test("zitadelUserRolesSave updates existing grant preserving unknown roles like contributor", async () => {
  let capturedBody: unknown = null

  const mockFetch = async (_input: string | URL | Request, init?: RequestInit) => {
    if (init?.method === "PUT") {
      capturedBody = JSON.parse(init.body as string)
      return new Response(JSON.stringify({ details: {} }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }
    // GET list user grants
    return new Response(
      JSON.stringify({
        result: [
          {
            id: "grant-existing",
            userId: "user-1",
            projectId: testConfig.projectId,
            orgId: testConfig.organizationId,
            roleKeys: ["contributor", "user"],
            state: 1,
          },
        ],
        details: { totalResult: "1" },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )
  }

  const result = await zitadelUserRolesSave({
    config: testConfig,
    userId: "user-1",
    roles: [userRole.member, userRole.admin],
    fetch: mockFetch,
  })

  expect(result.success).toBe(true)
  if (!result.success) return
  expect(result.data.grantId).toBe("grant-existing")
  // contributor must be preserved, user replaced by member and admin
  expect(result.data.roleKeys).toEqual(["contributor", "member", "admin"])
  expect(capturedBody).toEqual({ roleKeys: ["contributor", "member", "admin"] })
})

test("zitadelUserTeamIdsSave sets solid-convex.teamIds metadata in Zitadel", async () => {
  const captured: { entry?: { key: string; value: Uint8Array } } = {}

  const transport = createRouterTransport(({ service }) => {
    service(UserService, {
      async setUserMetadata(req) {
        expect(req.userId).toBe("user-teams")
        const first = req.metadata[0]
        if (first) {
          captured.entry = { key: first.key, value: first.value }
        }
        return {}
      },
    })
  })

  const result = await zitadelUserTeamIdsSave({
    config: testConfig,
    userId: "user-teams",
    teamIds: ["team-1", "team-2"],
    transport,
  })

  expect(result.success).toBe(true)
  if (!result.success) return
  expect(result.data.teamIds).toEqual(["team-1", "team-2"])
  if (!captured.entry) {
    throw new Error("Expected captured entry to be set")
  }
  expect(captured.entry.key).toBe(zitadelMetadataTeamIdsKey)
  const decoded = JSON.parse(new TextDecoder().decode(captured.entry.value))
  expect(decoded).toEqual(["team-1", "team-2"])
})

test("zitadelUserAssignmentSave handles full success when roles and teamIds are both updated", async () => {
  const mockFetch = async (_url: string | URL | Request, init?: RequestInit) => {
    if (init?.method === "PUT") {
      return new Response(JSON.stringify({ details: {} }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }
    return new Response(
      JSON.stringify({
        result: [
          {
            id: "grant-1",
            userId: "user-combo",
            projectId: testConfig.projectId,
            orgId: testConfig.organizationId,
            roleKeys: ["contributor"],
            state: 1,
          },
        ],
        details: { totalResult: "1" },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )
  }

  const transport = createRouterTransport(({ service }) => {
    service(UserService, {
      async setUserMetadata() {
        return {}
      },
    })
  })

  const result = await zitadelUserAssignmentSave({
    config: testConfig,
    userId: "user-combo",
    roles: [userRole.admin],
    teamIds: ["team-99"],
    transport,
    fetch: mockFetch,
  })

  expect(result.success).toBe(true)
  if (!result.success) return
  expect(result.data.rolesUpdated).toBe(true)
  expect(result.data.teamIdsUpdated).toBe(true)
  expect(result.data.roleKeys).toEqual(["contributor", "admin"])
  expect(result.data.teamIds).toEqual(["team-99"])
})

test("zitadelUserAssignmentSave reports partial write failure when roles update succeeds but metadata write fails", async () => {
  const mockFetch = async () => {
    return new Response(JSON.stringify({ details: {} }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  }

  const failingTransport = createRouterTransport(({ service }) => {
    service(UserService, {
      async setUserMetadata() {
        throw new Error("Metadata write rejected by remote Zitadel")
      },
    })
  })

  const result = await zitadelUserAssignmentSave({
    config: testConfig,
    userId: "user-partial",
    roles: [userRole.user],
    teamIds: ["team-abc"],
    existingGrant: { id: "grant-1", roleKeys: ["contributor"] },
    transport: failingTransport,
    fetch: mockFetch,
  })

  expect(result.success).toBe(false)
  if (result.success) return
  expect(result.errorMessage).toContain("Partial write failure")
  expect(result.errorData).toBeDefined()
  const raw = JSON.parse(result.errorData as string) as { rolesUpdated: boolean; teamIdsUpdated: boolean }
  expect(raw.rolesUpdated).toBe(true)
  expect(raw.teamIdsUpdated).toBe(false)
})

test("zitadelUserAssignmentSave reports partial write failure when metadata succeeds but roles update fails", async () => {
  const failingFetch = async () => {
    return new Response("Gateway error", { status: 502 })
  }

  const successTransport = createRouterTransport(({ service }) => {
    service(UserService, {
      async setUserMetadata() {
        return {}
      },
    })
  })

  const result = await zitadelUserAssignmentSave({
    config: testConfig,
    userId: "user-partial-2",
    roles: [userRole.user],
    teamIds: ["team-abc"],
    existingGrant: { id: "grant-1", roleKeys: ["contributor"] },
    transport: successTransport,
    fetch: failingFetch,
  })

  expect(result.success).toBe(false)
  if (result.success) return
  expect(result.errorMessage).toContain("Partial write failure")
  expect(result.errorData).toBeDefined()
  const raw = JSON.parse(result.errorData as string) as { rolesUpdated: boolean; teamIdsUpdated: boolean }
  expect(raw.rolesUpdated).toBe(false)
  expect(raw.teamIdsUpdated).toBe(true)
})

test("zitadelUserRolesSave no-ops when no grant exists and desired roles are empty", async () => {
  const writeRequests: Array<{ method?: string; url: string }> = []

  const mockFetch = async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
    const method = init?.method ?? "GET"

    if (method === "PUT" || (method === "POST" && !url.includes("_search"))) {
      writeRequests.push({ method, url })
      return new Response(JSON.stringify({ details: {} }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    return new Response(
      JSON.stringify({
        result: [],
        details: { totalResult: "0" },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )
  }

  const result = await zitadelUserRolesSave({
    config: testConfig,
    userId: "user-no-grant",
    roles: [],
    fetch: mockFetch,
  })

  expect(result.success).toBe(true)
  if (!result.success) return
  expect(result.data.grantId).toBeUndefined()
  expect(result.data.roleKeys).toEqual([])
  expect(writeRequests).toHaveLength(0)
})

test("zitadelUserRolesSave updates existing grant to empty when desired canonical roles are empty", async () => {
  let capturedBody: unknown = null

  const mockFetch = async (_input: string | URL | Request, init?: RequestInit) => {
    if (init?.method === "PUT") {
      capturedBody = JSON.parse(init.body as string)
      return new Response(JSON.stringify({ details: {} }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }
    return new Response(
      JSON.stringify({
        result: [
          {
            id: "grant-existing-only-user",
            userId: "user-1",
            projectId: testConfig.projectId,
            orgId: testConfig.organizationId,
            roleKeys: ["user"],
            state: 1,
          },
        ],
        details: { totalResult: "1" },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )
  }

  const result = await zitadelUserRolesSave({
    config: testConfig,
    userId: "user-1",
    roles: [],
    fetch: mockFetch,
  })

  expect(result.success).toBe(true)
  if (!result.success) return
  expect(result.data.grantId).toBe("grant-existing-only-user")
  expect(result.data.roleKeys).toEqual([])
  expect(capturedBody).toEqual({ roleKeys: [] })
})

test("zitadelUserAssignmentSave performs zero grant writes when no grant exists and roles are empty, while saving teams metadata", async () => {
  const writeRequests: Array<{ method?: string; url: string }> = []

  const mockFetch = async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url
    const method = init?.method ?? "GET"

    if (method === "PUT" || (method === "POST" && !url.includes("_search"))) {
      writeRequests.push({ method, url })
      return new Response(JSON.stringify({ details: {} }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    return new Response(
      JSON.stringify({
        result: [],
        details: { totalResult: "0" },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )
  }

  const capturedMetadata: { key?: string; teamIds?: unknown } = {}

  const transport = createRouterTransport(({ service }) => {
    service(UserService, {
      async setUserMetadata(req) {
        expect(req.userId).toBe("user-no-grant")
        const first = req.metadata[0]
        if (first) {
          capturedMetadata.key = first.key
          capturedMetadata.teamIds = JSON.parse(new TextDecoder().decode(first.value))
        }
        return {}
      },
    })
  })

  const result = await zitadelUserAssignmentSave({
    config: testConfig,
    userId: "user-no-grant",
    roles: [],
    teamIds: ["team-alpha", "team-beta"],
    transport,
    fetch: mockFetch,
  })

  expect(result.success).toBe(true)
  if (!result.success) return
  expect(result.data.rolesUpdated).toBe(true)
  expect(result.data.teamIdsUpdated).toBe(true)
  expect(result.data.roleKeys).toEqual([])
  expect(result.data.teamIds).toEqual(["team-alpha", "team-beta"])
  expect(writeRequests).toHaveLength(0)
  expect(capturedMetadata.key).toBe(zitadelMetadataTeamIdsKey)
  expect(capturedMetadata.teamIds).toEqual(["team-alpha", "team-beta"])
})
