import { expect, test } from "bun:test"
import { UserService } from "@adaptive-ds/zitadel-cli"
import { Code, ConnectError, createRouterTransport } from "@connectrpc/connect"
import { zitadelMetadataTeamIdsKey } from "#src/user_management/server/zitadelMetadataTeamIdsKey.ts"
import type { ZitadelServerConfig } from "#src/user_management/server/zitadelServerConfigSchema.ts"
import {
  type ZitadelUserCleanupUserUpdate,
  zitadelUserDeletedTeamIdsCleanup,
} from "#src/user_management/server/zitadelUserDeletedTeamIdsCleanup.ts"
import { zitadelUserTeamIdsEncode } from "#src/user_management/server/zitadelUserTeamIdsEncode.ts"

const testConfig: ZitadelServerConfig = {
  baseUrl: "https://auth.example.com",
  token: "test-token-123",
  organizationId: "org-100",
  projectId: "proj-200",
}

test("zitadelUserDeletedTeamIdsCleanup removes deleted team IDs while preserving unrelated assignments", async () => {
  const capturedWrites: Array<{ userId: string; teamIds: string[] }> = []
  const capturedUpdates: ZitadelUserCleanupUserUpdate[] = []

  const transport = createRouterTransport(({ service }) => {
    service(UserService, {
      async listUsers() {
        return {
          details: { totalResult: 1n },
          result: [
            {
              userId: "user-alice",
              username: "alice",
            },
          ],
        }
      },
      async listUserMetadata(req) {
        if (req.userId === "user-alice") {
          return {
            metadata: [
              {
                key: zitadelMetadataTeamIdsKey,
                value: zitadelUserTeamIdsEncode(["team-deleted-1", "team-keep-1", "team-keep-2"]),
              },
            ],
          }
        }
        return { metadata: [] }
      },
      async setUserMetadata(req) {
        const entry = req.metadata.find((m) => m.key === zitadelMetadataTeamIdsKey)
        const teamIds = entry ? (JSON.parse(new TextDecoder().decode(entry.value)) as string[]) : []
        capturedWrites.push({ userId: req.userId, teamIds })
        return {}
      },
    })
  })

  const result = await zitadelUserDeletedTeamIdsCleanup({
    config: testConfig,
    deletedTeamIds: ["team-deleted-1"],
    transport,
    onUserUpdated: async (update) => {
      capturedUpdates.push(update)
    },
  })

  expect(result.success).toBe(true)
  if (!result.success) return

  expect(result.data.processedCount).toBe(1)
  expect(result.data.updatedUsers).toHaveLength(1)
  expect(result.data.updatedUsers[0]?.userId).toBe("user-alice")
  expect(result.data.updatedUsers[0]?.previousTeamIds).toEqual(["team-deleted-1", "team-keep-1", "team-keep-2"])
  expect(result.data.updatedUsers[0]?.newTeamIds).toEqual(["team-keep-1", "team-keep-2"])

  expect(capturedWrites).toHaveLength(1)
  expect(capturedWrites[0]?.userId).toBe("user-alice")
  expect(capturedWrites[0]?.teamIds).toEqual(["team-keep-1", "team-keep-2"])

  expect(capturedUpdates).toHaveLength(1)
  expect(capturedUpdates[0]?.newTeamIds).toEqual(["team-keep-1", "team-keep-2"])
})

test("zitadelUserDeletedTeamIdsCleanup is idempotent when deleted team is already absent", async () => {
  let writeCallCount = 0

  const transport = createRouterTransport(({ service }) => {
    service(UserService, {
      async listUsers() {
        return {
          details: { totalResult: 1n },
          result: [
            {
              userId: "user-bob",
              username: "bob",
            },
          ],
        }
      },
      async listUserMetadata() {
        return {
          metadata: [
            {
              key: zitadelMetadataTeamIdsKey,
              value: zitadelUserTeamIdsEncode(["team-keep-alpha", "team-keep-beta"]),
            },
          ],
        }
      },
      async setUserMetadata() {
        writeCallCount += 1
        return {}
      },
    })
  })

  const result = await zitadelUserDeletedTeamIdsCleanup({
    config: testConfig,
    deletedTeamIds: ["team-already-deleted"],
    transport,
  })

  expect(result.success).toBe(true)
  if (!result.success) return

  expect(result.data.processedCount).toBe(1)
  expect(result.data.updatedUsers).toHaveLength(0)
  expect(result.data.skippedUserIds).toEqual(["user-bob"])
  expect(writeCallCount).toBe(0)
})

test("zitadelUserDeletedTeamIdsCleanup handles page error gracefully", async () => {
  const transport = createRouterTransport(({ service }) => {
    service(UserService, {
      async listUsers() {
        throw new ConnectError("Zitadel user directory unavailable", Code.Unavailable)
      },
    })
  })

  const result = await zitadelUserDeletedTeamIdsCleanup({
    config: testConfig,
    deletedTeamIds: ["team-deleted"],
    transport,
  })

  expect(result.success).toBe(false)
  if (result.success) return

  expect(result.op).toBe("zitadelUserDeletedTeamIdsCleanup")
  expect(result.errorMessage).toContain("Zitadel user directory unavailable")
})

test("zitadelUserDeletedTeamIdsCleanup reports explicit retryable partial errors per user", async () => {
  const transport = createRouterTransport(({ service }) => {
    service(UserService, {
      async listUsers() {
        return {
          details: { totalResult: 2n },
          result: [
            { userId: "user-ok", username: "ok_user" },
            { userId: "user-fail", username: "fail_user" },
          ],
        }
      },
      async listUserMetadata() {
        return {
          metadata: [
            {
              key: zitadelMetadataTeamIdsKey,
              value: zitadelUserTeamIdsEncode(["team-del", "team-stay"]),
            },
          ],
        }
      },
      async setUserMetadata(req) {
        if (req.userId === "user-fail") {
          throw new ConnectError("Metadata write locked", Code.Aborted)
        }
        return {}
      },
    })
  })

  const result = await zitadelUserDeletedTeamIdsCleanup({
    config: testConfig,
    deletedTeamIds: ["team-del"],
    transport,
  })

  expect(result.success).toBe(true)
  if (!result.success) return

  expect(result.data.processedCount).toBe(2)
  expect(result.data.updatedUsers).toHaveLength(1)
  expect(result.data.updatedUsers[0]?.userId).toBe("user-ok")

  expect(result.data.errors).toHaveLength(1)
  expect(result.data.errors[0]?.userId).toBe("user-fail")
  expect(result.data.errors[0]?.retryable).toBe(true)
  expect(result.data.errors[0]?.message).toContain("Metadata write locked")
})

test("zitadelUserDeletedTeamIdsCleanup supports bounded paging and cursor continuation", async () => {
  const transport = createRouterTransport(({ service }) => {
    service(UserService, {
      async listUsers(req) {
        const offset = Number(req.query?.offset ?? 0n)
        const limit = req.query?.limit ?? 2
        const total = 5

        const pageUsers = []
        for (let i = 0; i < limit && offset + i < total; i++) {
          pageUsers.push({
            userId: `user-${offset + i}`,
            username: `user_${offset + i}`,
          })
        }

        return {
          details: { totalResult: BigInt(total) },
          result: pageUsers,
        }
      },
      async listUserMetadata() {
        return { metadata: [] }
      },
      async setUserMetadata() {
        return {}
      },
    })
  })

  // Page 1: limit 2, offset 0
  const page1 = await zitadelUserDeletedTeamIdsCleanup({
    config: testConfig,
    deletedTeamIds: ["team-x"],
    limit: 2,
    offset: 0,
    transport,
  })

  expect(page1.success).toBe(true)
  if (!page1.success) return
  expect(page1.data.processedCount).toBe(2)
  expect(page1.data.totalCount).toBe(5)
  expect(page1.data.hasMore).toBe(true)
  expect(page1.data.nextCursor).toBe("2")
  expect(page1.data.nextOffset).toBe(2)

  // Page 2: using cursor from page 1
  const page2 = await zitadelUserDeletedTeamIdsCleanup({
    config: testConfig,
    deletedTeamIds: ["team-x"],
    limit: 2,
    cursor: page1.data.nextCursor ?? undefined,
    transport,
  })

  expect(page2.success).toBe(true)
  if (!page2.success) return
  expect(page2.data.processedCount).toBe(2)
  expect(page2.data.hasMore).toBe(true)
  expect(page2.data.nextCursor).toBe("4")

  // Page 3: last user
  const page3 = await zitadelUserDeletedTeamIdsCleanup({
    config: testConfig,
    deletedTeamIds: ["team-x"],
    limit: 2,
    cursor: page2.data.nextCursor ?? undefined,
    transport,
  })

  expect(page3.success).toBe(true)
  if (!page3.success) return
  expect(page3.data.processedCount).toBe(1)
  expect(page3.data.hasMore).toBe(false)
  expect(page3.data.nextCursor).toBeNull()
})
