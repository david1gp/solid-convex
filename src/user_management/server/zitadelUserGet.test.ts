import { expect, test } from "bun:test"
import { UserService } from "@adaptive-ds/zitadel-cli"
import { createRouterTransport } from "@connectrpc/connect"
import type { ZitadelServerConfig } from "#src/user_management/server/zitadelServerConfigSchema.ts"
import { zitadelUserGet } from "#src/user_management/server/zitadelUserGet.ts"

const testConfig: ZitadelServerConfig = {
  baseUrl: "https://auth.example.com",
  token: "test-token-123",
  organizationId: "org-primary",
  projectId: "proj-100",
}

test("zitadelUserGet succeeds when user belongs to target organization", async () => {
  const transport = createRouterTransport(({ service }) => {
    service(UserService, {
      async getUserByID(req) {
        expect(req.userId).toBe("user-1")
        return {
          user: {
            userId: "user-1",
            username: "user_one",
            preferredLoginName: "one@example.com",
            state: 1,
            details: {
              resourceOwner: "org-primary",
            },
            type: {
              case: "human",
              value: {
                profile: { displayName: "User One" },
                email: { email: "one@example.com" },
              },
            },
          },
        }
      },
    })
  })

  const result = await zitadelUserGet({
    config: testConfig,
    userId: "user-1",
    organizationId: "org-primary",
    transport,
  })

  expect(result.success).toBe(true)
  if (!result.success) return
  expect(result.data.id).toBe("user-1")
  expect(result.data.displayName).toBe("User One")
})

test("zitadelUserGet rejects user belonging to a foreign organization", async () => {
  const transport = createRouterTransport(({ service }) => {
    service(UserService, {
      async getUserByID(req) {
        return {
          user: {
            userId: "user-foreign",
            username: "foreign_user",
            preferredLoginName: "foreign@example.com",
            state: 1,
            details: {
              resourceOwner: "org-foreign",
            },
            type: {
              case: "human",
              value: {
                profile: { displayName: "Foreign User" },
              },
            },
          },
        }
      },
    })
  })

  const result = await zitadelUserGet({
    config: testConfig,
    userId: "user-foreign",
    organizationId: "org-primary",
    transport,
  })

  expect(result.success).toBe(false)
  if (!result.success) {
    expect(result.errorMessage).toMatch(/belongs to organization org-foreign, not target organization org-primary/)
  }
})

test("zitadelUserGet fails when user is missing", async () => {
  const transport = createRouterTransport(({ service }) => {
    service(UserService, {
      async getUserByID() {
        throw new Error("User not found")
      },
      async listUsers() {
        return {
          result: [],
        }
      },
    })
  })

  const result = await zitadelUserGet({
    config: testConfig,
    userId: "user-nonexistent",
    organizationId: "org-primary",
    transport,
  })

  expect(result.success).toBe(false)
  if (!result.success) {
    expect(result.errorMessage).toMatch(/not found/)
  }
})
