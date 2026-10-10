import { expect, test } from "bun:test"
import { createUserFromAuthProviderFn } from "#src/auth/convex/crud/createUserFromAuthProviderMutation.ts"
import { findOrCreateUserFn } from "#src/auth/convex/crud/findOrCreateUserFn.ts"
import type { UserRole } from "#src/auth/model_field/userRole.ts"

function persistenceCtx(rows: {
  users: Record<string, any>[]
  authAccounts: Record<string, any>[]
  orgMembers: Record<string, any>[]
}) {
  return {
    db: {
      query(table: keyof typeof rows) {
        let filters: Record<string, unknown> = {}
        const builder = {
          withIndex(_name: string, callback: (query: { eq: (field: string, value: unknown) => unknown }) => unknown) {
            filters = {}
            const query = {
              eq: (field: string, value: unknown) => {
                filters[field] = value
                return query
              },
            }
            callback(query)
            return builder
          },
          unique: async () =>
            rows[table].find((row) => Object.entries(filters).every(([key, value]) => row[key] === value)) ?? null,
          first: async () =>
            rows[table].find((row) => Object.entries(filters).every(([key, value]) => row[key] === value)) ?? null,
        }
        return builder
      },
      get: async (table: keyof typeof rows, id: string) => rows[table].find((row) => row._id === id) ?? null,
      patch: async (table: keyof typeof rows, id: string, value: Record<string, unknown>) => {
        const row = rows[table].find((candidate) => candidate._id === id)
        if (row) Object.assign(row, value)
      },
      insert: async (table: keyof typeof rows, value: Record<string, unknown>) => {
        const row = { ...value, _id: `${table}-${rows[table].length + 1}`, _creationTime: Date.now() }
        rows[table].push(row)
        return row._id
      },
    },
  } as never
}

function provider(overrides: Record<string, unknown> = {}) {
  return {
    provider: "google" as const,
    providerId: "google-subject",
    givenName: "Updated",
    familyName: "Person",
    image: "https://example.test/new.png",
    username: "updated-person",
    email: "person@example.test",
    ...overrides,
  }
}

function existingUser(overrides: Record<string, unknown> = {}) {
  return {
    _id: "user-1",
    _creationTime: Date.now(),
    name: "Original Person",
    image: "https://example.test/old.png",
    email: "person@example.test",
    role: "user",
    createdAt: "2026-09-22T00:00:00.000Z",
    updatedAt: "2026-09-22T00:00:00.000Z",
    ...overrides,
  }
}

function authAccount(overrides: Record<string, unknown> = {}) {
  return {
    _id: "account-1",
    _creationTime: Date.now(),
    userId: "user-1",
    provider: "google",
    providerAccountId: "google-subject",
    createdAt: "2026-09-22T00:00:00.000Z",
    updatedAt: "2026-09-22T00:00:00.000Z",
    ...overrides,
  }
}

type TestRows = {
  users: ReturnType<typeof existingUser>[]
  authAccounts: ReturnType<typeof authAccount>[]
  orgMembers: Record<string, unknown>[]
}

test("OIDC role synchronization upgrades and downgrades an existing user on each login", async () => {
  const user = {
    _id: "user-1",
    _creationTime: Date.now(),
    name: "Ada User",
    image: "",
    email: "ada@example.test",
    role: "user" as UserRole,
    createdAt: "2026-09-22T00:00:00.000Z",
    updatedAt: "2026-09-22T00:00:00.000Z",
  }
  const account = {
    _id: "account-1",
    _creationTime: Date.now(),
    userId: user._id,
    provider: "oidc" as const,
    issuer: "https://issuer.example",
    providerAccountId: "subject-1",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
  const rows = { users: [user], authAccounts: [account], orgMembers: [] as unknown[] }
  const ctx = {
    db: {
      query(table: keyof typeof rows) {
        const builder = {
          withIndex(_name: string, callback: (query: { eq: (field: string, value: unknown) => unknown }) => unknown) {
            const query = { eq: () => query }
            callback(query)
            return builder
          },
          unique: async () => (table === "authAccounts" ? rows.authAccounts[0] : null),
          first: async () => null,
        }
        return builder
      },
      get: async (table: keyof typeof rows) => (table === "users" ? rows.users[0] : null),
      patch: async (_table: "users", _id: string, value: Partial<typeof user>) => Object.assign(user, value),
    },
  } as never
  const provider = {
    provider: "oidc" as const,
    issuer: account.issuer,
    providerId: account.providerAccountId,
    givenName: "Ada",
    familyName: "User",
    image: "",
    username: "ada",
    role: "admin" as const,
  }

  const upgrade = await findOrCreateUserFn(ctx, provider)
  expect(upgrade.success).toBe(true)
  expect(user.role).toBe("admin")
  if (upgrade.success) expect(upgrade.data.profile.role).toBe("admin")

  const downgrade = await findOrCreateUserFn(ctx, { ...provider, role: "user" })
  expect(downgrade.success).toBe(true)
  expect(user.role).toBe("user")
  if (downgrade.success) expect(downgrade.data.profile.role).toBe("user")
})

test("OIDC role synchronization assigns a configured role to a new user", async () => {
  const rows = { users: [] as Record<string, unknown>[], authAccounts: [] as Record<string, unknown>[] }
  const ctx = {
    db: {
      query(_table: keyof typeof rows) {
        const builder = {
          withIndex(_name: string, callback: (query: { eq: (field: string, value: unknown) => unknown }) => unknown) {
            const query = { eq: () => query }
            callback(query)
            return builder
          },
          unique: async () => null,
        }
        return builder
      },
      insert: async (table: keyof typeof rows, value: Record<string, unknown>) => {
        const row = { ...value, _id: `${table}-1`, _creationTime: Date.now() }
        rows[table].push(row)
        return row._id
      },
    },
  } as never

  const result = await createUserFromAuthProviderFn(ctx, {
    provider: "oidc",
    issuer: "https://issuer.example",
    providerId: "subject-2",
    givenName: "Grace",
    familyName: "Hopper",
    image: "",
    username: "grace",
    role: "admin",
  })

  expect(result.success).toBe(true)
  expect(rows.users[0]?.role).toBe("admin")
  if (result.success) expect(result.data.role).toBe("admin")
})

test("the admin provider creates a normal user rather than granting admin", async () => {
  const rows = { users: [] as Record<string, unknown>[], authAccounts: [] as Record<string, unknown>[] }
  const ctx = {
    db: {
      query(_table: keyof typeof rows) {
        const builder = {
          withIndex(_name: string, callback: (query: { eq: (field: string, value: unknown) => unknown }) => unknown) {
            const query = { eq: () => query }
            callback(query)
            return builder
          },
          unique: async () => null,
        }
        return builder
      },
      insert: async (table: keyof typeof rows, value: Record<string, unknown>) => {
        const row = { ...value, _id: `${table}-1`, _creationTime: Date.now() }
        rows[table].push(row)
        return row._id
      },
    },
  } as never

  const result = await createUserFromAuthProviderFn(ctx, {
    provider: "admin",
    providerId: "admin-user",
    givenName: "Admin",
    familyName: "User",
    image: "",
    username: "admin-user",
  })

  expect(result.success).toBe(true)
  expect(rows.users[0]?.role).toBe("user")
  expect(rows.authAccounts[0]?.provider).toBe("admin")
  if (result.success) expect(result.data.role).toBe("user")
})

test("an existing social account refreshes supplied name and picture without replacing its email or local role", async () => {
  const user = existingUser({ role: "admin" })
  const rows = { users: [user], authAccounts: [authAccount()], orgMembers: [] }

  const result = await findOrCreateUserFn(persistenceCtx(rows), provider({ email: "someone-elses@example.test" }))

  expect(result.success).toBe(true)
  expect(user.name).toBe("Updated Person")
  expect(user.image).toBe("https://example.test/new.png")
  expect(user.email).toBe("person@example.test")
  expect(user.role).toBe("admin")
  if (result.success) expect(result.data.profile.role).toBe("admin")
})

test("the first social link refreshes supplied profile fields but keeps the matched email", async () => {
  const user = existingUser()
  const rows = { users: [user], authAccounts: [], orgMembers: [] }

  const result = await findOrCreateUserFn(persistenceCtx(rows), provider())

  expect(result.success).toBe(true)
  expect(rows.authAccounts).toHaveLength(1)
  expect(user.name).toBe("Updated Person")
  expect(user.image).toBe("https://example.test/new.png")
  expect(user.email).toBe("person@example.test")
})

test("a new social user persists the provider name and picture", async () => {
  const rows: TestRows = { users: [], authAccounts: [], orgMembers: [] }

  const result = await findOrCreateUserFn(persistenceCtx(rows), provider())

  expect(result.success).toBe(true)
  expect(rows.users).toHaveLength(1)
  expect(rows.users[0]?.name).toBe("Updated Person")
  expect(rows.users[0]?.image).toBe("https://example.test/new.png")
  if (result.success) {
    expect(result.data.profile.name).toBe("Updated Person")
    expect(result.data.profile.image).toBe("https://example.test/new.png")
  }
})

test("a new social user without profile fields gets the existing minimal defaults", async () => {
  const rows: TestRows = { users: [], authAccounts: [], orgMembers: [] }
  const authData = provider({ givenName: "", familyName: "", username: "", image: "", email: undefined })

  const result = await findOrCreateUserFn(persistenceCtx(rows), authData)

  expect(result.success).toBe(true)
  expect(rows.users[0]?.name).toBe("New User")
  expect(rows.users[0]?.image).toBe("")
})

test("name-only and picture-only provider updates refresh independently", async () => {
  const nameUser = existingUser()
  const nameRows = { users: [nameUser], authAccounts: [authAccount()], orgMembers: [] }
  await findOrCreateUserFn(persistenceCtx(nameRows), provider({ image: "", email: undefined }))
  expect(nameUser.name).toBe("Updated Person")
  expect(nameUser.image).toBe("https://example.test/old.png")

  const pictureUser = existingUser()
  const pictureRows = { users: [pictureUser], authAccounts: [authAccount()], orgMembers: [] }
  await findOrCreateUserFn(
    persistenceCtx(pictureRows),
    provider({
      givenName: "",
      familyName: "",
      username: "",
      image: "https://example.test/picture-only.png",
      email: undefined,
    }),
  )
  expect(pictureUser.name).toBe("Original Person")
  expect(pictureUser.image).toBe("https://example.test/picture-only.png")
})

test("absent and blank provider profile fields do not erase a real name or picture", async () => {
  const user = existingUser()
  const rows = { users: [user], authAccounts: [authAccount()], orgMembers: [] }
  await findOrCreateUserFn(
    persistenceCtx(rows),
    provider({ givenName: " ", familyName: "", username: "", image: "   ", email: undefined }),
  )
  expect(user.name).toBe("Original Person")
  expect(user.image).toBe("https://example.test/old.png")
})

test("a provider username without a real name cannot overwrite an existing name", async () => {
  const user = existingUser()
  const rows = { users: [user], authAccounts: [authAccount()], orgMembers: [] }
  const result = await findOrCreateUserFn(
    persistenceCtx(rows),
    provider({ givenName: "", familyName: "", username: "login-name", image: "", email: undefined }),
  )

  expect(result.success).toBe(true)
  expect(user.name).toBe("Original Person")
  expect(user.image).toBe("https://example.test/old.png")
})

test("an existing social account cannot claim another user's email", async () => {
  const user = existingUser()
  const otherUser = existingUser({ _id: "user-2", email: "collision@example.test", name: "Other Person" })
  const rows = { users: [user, otherUser], authAccounts: [authAccount()], orgMembers: [] }
  const result = await findOrCreateUserFn(persistenceCtx(rows), provider({ email: "collision@example.test" }))
  expect(result.success).toBe(true)
  expect(user.email).toBe("person@example.test")
  expect(otherUser.email).toBe("collision@example.test")
  expect(rows.authAccounts).toHaveLength(1)
})

test("OIDC does not link an account by email", async () => {
  const existing = existingUser({ email: "collision@example.test" })
  const rows: TestRows = { users: [existing], authAccounts: [], orgMembers: [] }
  const oidcProvider = {
    provider: "oidc" as const,
    issuer: "https://issuer.example.test",
    providerId: "oidc-subject",
    givenName: "New",
    familyName: "Person",
    image: "",
    username: "new-person",
    email: "collision@example.test",
  }

  const result = await findOrCreateUserFn(persistenceCtx(rows), oidcProvider)

  expect(result.success).toBe(true)
  expect(rows.users).toHaveLength(2)
  expect(rows.authAccounts).toHaveLength(1)
  expect(rows.authAccounts[0]?.userId).not.toBe(existing._id)
  expect(existing.email).toBe("collision@example.test")
})
