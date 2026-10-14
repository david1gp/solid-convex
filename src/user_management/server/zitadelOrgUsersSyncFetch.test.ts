import { expect, test } from "bun:test"
import { UserService } from "@adaptive-ds/zitadel-cli"
import { createRouterTransport } from "@connectrpc/connect"
import { zitadelMetadataTeamIdsKey } from "#src/user_management/server/zitadelMetadataTeamIdsKey.ts"
import { zitadelOrgUsersSyncFetch } from "#src/user_management/server/zitadelOrgUsersSyncFetch.ts"
import type { ZitadelServerConfig } from "#src/user_management/server/zitadelServerConfigSchema.ts"

const testConfig: ZitadelServerConfig = {
  baseUrl: "https://auth.example.com",
  token: "test-token-123",
  organizationId: "org-100",
  projectId: "proj-200",
}

test("zitadelOrgUsersSyncFetch pages through >100 users and >100 grants and derives isComplete", async () => {
  // Mock 150 total users across two pages (100 and 50)
  const totalUsers = 150
  const transport = createRouterTransport(({ service }) => {
    service(UserService, {
      async listUsers(req): Promise<any> {
        const offset = Number(req.query?.offset ?? 0n)
        const limit = req.query?.limit ?? 100
        const pageUsers = []
        for (let i = offset; i < Math.min(offset + limit, totalUsers); i++) {
          pageUsers.push({
            userId: `user-${i}`,
            username: `user_${i}`,
            preferredLoginName: `user_${i}@example.com`,
            state: 1,
            type: {
              case: "human" as const,
              value: {
                profile: { displayName: `User ${i}` },
                email: { email: `user_${i}@example.com` },
              },
            },
          })
        }
        return {
          details: { totalResult: BigInt(totalUsers) },
          result: pageUsers,
        }
      },
      async listUserMetadata(req) {
        // Return empty or valid team IDs for each user
        return {
          metadata: [
            {
              key: zitadelMetadataTeamIdsKey,
              value: new TextEncoder().encode(JSON.stringify(["team-1"])),
            },
          ],
        }
      },
    })
  })

  // Mock >100 grants (e.g. 120 grants across 2 pages)
  let grantCalls = 0
  const mockFetch = async (_input: string | URL | Request, init?: RequestInit) => {
    grantCalls += 1
    const body = init?.body ? JSON.parse(init.body as string) : {}
    const offset = body.query?.offset ?? 0
    const limit = body.query?.limit ?? 100
    const pageGrants = []
    const totalGrants = 120
    for (let i = offset; i < Math.min(offset + limit, totalGrants); i++) {
      pageGrants.push({
        id: `grant-${i}`,
        userId: `user-${i}`,
        projectId: testConfig.projectId,
        orgId: testConfig.organizationId,
        roleKeys: ["admin"],
        state: 1,
      })
    }
    return new Response(
      JSON.stringify({
        result: pageGrants,
        details: { totalResult: String(totalGrants) },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )
  }

  const result = await zitadelOrgUsersSyncFetch({
    config: testConfig,
    transport,
    fetch: mockFetch,
    pageSize: 100,
  })

  expect(result.success).toBe(true)
  if (!result.success) return

  expect(result.data.totalCount).toBe(150)
  expect(result.data.records.length).toBe(150)
  expect(result.data.isComplete).toBe(true)
  expect(grantCalls).toBe(2) // 2 pages of grants fetched
  expect(result.data.records[0]?.teamIds).toEqual(["team-1"])
  expect(result.data.records[0]?.roles).toEqual(["admin"])
})

test("zitadelOrgUsersSyncFetch fails when grants endpoint returns error and never defaults to empty", async () => {
  const transport = createRouterTransport(({ service }) => {
    service(UserService, {
      async listUsers() {
        return {
          details: { totalResult: 1n },
          result: [
            {
              userId: "u1",
              username: "u1",
              preferredLoginName: "u1@example.com",
              state: 1,
            },
          ],
        }
      },
    })
  })

  const failingFetch = async () => {
    return new Response(JSON.stringify({ message: "Network failure" }), { status: 500 })
  }

  const result = await zitadelOrgUsersSyncFetch({
    config: testConfig,
    transport,
    fetch: failingFetch,
  })

  expect(result.success).toBe(false)
  if (!result.success) {
    expect(result.errorMessage).toMatch(/Failed to list project grants/)
  }
})

test("zitadelOrgUsersSyncFetch fails when user teamIds metadata fetch fails and never fabricates empty", async () => {
  const transport = createRouterTransport(({ service }) => {
    service(UserService, {
      async listUsers() {
        return {
          details: { totalResult: 1n },
          result: [
            {
              userId: "u1",
              username: "u1",
              preferredLoginName: "u1@example.com",
              state: 1,
            },
          ],
        }
      },
      async listUserMetadata() {
        throw new Error("Metadata service unavailable")
      },
    })
  })

  const mockFetch = async () => {
    return new Response(JSON.stringify({ result: [], details: { totalResult: "0" } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  }

  const result = await zitadelOrgUsersSyncFetch({
    config: testConfig,
    transport,
    fetch: mockFetch,
  })

  expect(result.success).toBe(false)
  if (!result.success) {
    expect(result.errorMessage).toMatch(/Failed to load team IDs/)
  }
})
