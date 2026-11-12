import { pageDemoFixtureStoreGet } from "#src/app/demos/pageDemoFixtureStoreGet.ts"
import type { UserProjection } from "#src/user_management/model/userProjectionSchema.ts"
import { createSignalObject } from "#ui/utils/createSignalObject.ts"

const key = "user-management-page-demo-fixtures"
const date = "2026-09-28T00:00:00.000Z"

/** Reactive in-memory user collection for user-management demo routes. Never
 * syncs with Zitadel and never persists. */
export function userManagementPageDemoFixturesGet() {
  const store = pageDemoFixtureStoreGet()
  const existing = store.get<ReturnType<typeof userManagementFixturesCreate>>(key)
  if (existing) return existing
  const fixtures = userManagementFixturesCreate()
  return store.set(key, fixtures)
}

function userManagementFixturesCreate() {
  const users = createSignalObject<UserProjection[]>([
    {
      userId: "user-1",
      organizationId: "org-sample-1",
      username: "testuser",
      preferredLoginName: "testuser",
      displayName: "Test User",
      email: "testuser@example.com",
      roles: ["admin"],
      teamIds: ["team-1", "team-2"],
      syncedAt: date,
    },
    {
      userId: "user-2",
      organizationId: "org-sample-1",
      username: "amina",
      preferredLoginName: "amina",
      displayName: "Amina Designer",
      email: "amina@example.com",
      roles: ["member"],
      teamIds: ["team-2"],
      syncedAt: date,
    },
    {
      userId: "user-3",
      organizationId: "org-sample-1",
      username: "rafa",
      preferredLoginName: "rafa",
      displayName: "Rafa Operator",
      email: "rafa@example.com",
      roles: ["member", "user"],
      teamIds: ["team-1"],
      syncedAt: date,
    },
    {
      userId: "user-4",
      organizationId: "org-sample-1",
      username: "guest",
      preferredLoginName: "guest",
      displayName: "Guest Viewer",
      email: "guest@example.com",
      roles: ["user"],
      teamIds: [],
      syncedAt: date,
    },
  ])
  return {
    users: users.get,
    get: (userId: string) => users.get().find((user) => user.userId === userId),
    assign(userId: string, data: { roles: string[]; teamIds: string[] }) {
      const current = users.get().find((user) => user.userId === userId)
      if (!current) return undefined
      const updated: UserProjection = { ...current, roles: [...data.roles], teamIds: [...data.teamIds] }
      users.set(users.get().map((user) => (user.userId === userId ? updated : user)))
      return updated
    },
    setRoles(userId: string, roles: readonly string[]) {
      const current = users.get().find((user) => user.userId === userId)
      if (!current) return undefined
      const updated: UserProjection = { ...current, roles: [...roles] }
      users.set(users.get().map((user) => (user.userId === userId ? updated : user)))
      return updated
    },
  }
}
