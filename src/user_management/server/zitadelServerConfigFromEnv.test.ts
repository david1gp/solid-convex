import { expect, test } from "bun:test"
import { zitadelServerConfigFromEnv } from "#src/user_management/server/zitadelServerConfigFromEnv.ts"

test("zitadelServerConfigFromEnv succeeds with explicit ZITADEL_* environment variables", () => {
  const result = zitadelServerConfigFromEnv({
    ZITADEL_BASE_URL: "https://auth.example.com/",
    ZITADEL_TOKEN: "service-token-123",
    ZITADEL_ORGANIZATION_ID: "org-456",
    ZITADEL_PROJECT_ID: "proj-789",
  })

  expect(result.success).toBe(true)
  if (!result.success) return
  expect(result.data.baseUrl).toBe("https://auth.example.com")
  expect(result.data.token).toBe("service-token-123")
  expect(result.data.organizationId).toBe("org-456")
  expect(result.data.projectId).toBe("proj-789")
})

test("zitadelServerConfigFromEnv falls back to OIDC_ISSUER and OIDC_ZITADEL_ORG_ID", () => {
  const result = zitadelServerConfigFromEnv({
    OIDC_ISSUER: "https://issuer.example.com",
    ZITADEL_SERVICE_ACCOUNT_TOKEN: "token-abc",
    OIDC_ZITADEL_ORG_ID: "org-oidc",
    ZITADEL_PROJECT_ID: "proj-xyz",
  })

  expect(result.success).toBe(true)
  if (!result.success) return
  expect(result.data.baseUrl).toBe("https://issuer.example.com")
  expect(result.data.token).toBe("token-abc")
  expect(result.data.organizationId).toBe("org-oidc")
  expect(result.data.projectId).toBe("proj-xyz")
})

test("zitadelServerConfigFromEnv rejects missing environment variables without filesystem fallback", () => {
  const result = zitadelServerConfigFromEnv({})

  expect(result.success).toBe(false)
  if (result.success) return
  expect(result.errorMessage).toContain("Invalid Zitadel server configuration in environment")
})

test("zitadelServerConfigFromEnv rejects invalid URL", () => {
  const result = zitadelServerConfigFromEnv({
    ZITADEL_BASE_URL: "not-a-valid-url",
    ZITADEL_TOKEN: "token",
    ZITADEL_ORGANIZATION_ID: "org-1",
    ZITADEL_PROJECT_ID: "proj-1",
  })

  expect(result.success).toBe(false)
  if (result.success) return
  expect(result.errorMessage).toContain("Invalid Zitadel server configuration")
})

test("zitadelServerConfigFromEnv failure excludes sentinel token and secret values while preserving field names", () => {
  const sentinelToken = "SUPER_SECRET_SENTINEL_TOKEN_TO_NEVER_LEAK_98765"

  const result = zitadelServerConfigFromEnv({
    ZITADEL_BASE_URL: "not-a-valid-url",
    ZITADEL_TOKEN: sentinelToken,
    ZITADEL_ORGANIZATION_ID: "org-1",
    // ZITADEL_PROJECT_ID is omitted
  })

  expect(result.success).toBe(false)
  if (result.success) return

  const serialized = JSON.stringify(result)

  expect(serialized).not.toContain(sentinelToken)
  expect(serialized).toContain("baseUrl")
  expect(serialized).toContain("projectId")

  expect(result.errorData).toBeDefined()
  const errorData = JSON.parse(result.errorData as string) as {
    missingFields: string[]
    invalidFields: string[]
    issues: string[]
  }
  expect(errorData.invalidFields).toContain("baseUrl")
  expect(errorData.missingFields).toContain("projectId")
  expect(errorData.invalidFields).not.toContain("token")
  expect(errorData.missingFields).not.toContain("token")
})
