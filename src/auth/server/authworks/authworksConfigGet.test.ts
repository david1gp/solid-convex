import { expect, test } from "bun:test"
import { authworksConfigGet } from "#src/auth/server/authworks/authworksConfigGet.ts"

test("authworksConfigGet reads server-only Authworks settings and defaults scopes", async () => {
  await withEnvironment(
    {
      AUTHWORKS_ISSUER: "https://authworks.example.test",
      AUTHWORKS_CLIENT_ID: "authworks-client-id",
      AUTHWORKS_CLIENT_SECRET: undefined,
      AUTHWORKS_SCOPE: undefined,
      AUTHWORKS_REDIRECT_URI: undefined,
      AUTHWORKS_ORGANIZATION_ID: undefined,
      ZITADEL_PROJECT_ID: undefined,
    },
    async () => {
      const result = authworksConfigGet()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({
          issuer: "https://authworks.example.test",
          clientId: "authworks-client-id",
          clientSecret: undefined,
          scopes: ["openid", "profile", "email"],
        })
      }
    },
  )

  await withEnvironment(
    {
      AUTHWORKS_ISSUER: "https://authworks.example.test",
      AUTHWORKS_CLIENT_ID: "authworks-client-id",
      AUTHWORKS_CLIENT_SECRET: "authworks-client-secret",
      AUTHWORKS_SCOPE: "openid profile email",
      AUTHWORKS_REDIRECT_URI: undefined,
      AUTHWORKS_ORGANIZATION_ID: "01a03273-0662-7b18-9b48-3a7ab29f0bfd",
      ZITADEL_PROJECT_ID: undefined,
    },
    async () => {
      const result = authworksConfigGet()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.clientSecret).toBe("authworks-client-secret")
        expect(result.data.authworksOrgId).toBe("01a03273-0662-7b18-9b48-3a7ab29f0bfd")
        expect(result.data.scopes).toEqual([
          "openid",
          "profile",
          "email",
          "urn:zitadel:iam:org:project:roles",
          "urn:zitadel:iam:org:project:role:user",
          "urn:zitadel:iam:org:project:role:member",
          "urn:zitadel:iam:org:project:role:admin",
        ])
      }
    },
  )

  await withEnvironment(
    {
      AUTHWORKS_ISSUER: "https://authworks.example.test",
      AUTHWORKS_CLIENT_ID: "authworks-client-id",
      AUTHWORKS_CLIENT_SECRET: undefined,
      AUTHWORKS_SCOPE: "openid profile email",
      AUTHWORKS_REDIRECT_URI: undefined,
      AUTHWORKS_ORGANIZATION_ID: "01a03273-0662-7b18-9b48-3a7ab29f0bfd",
      ZITADEL_PROJECT_ID: "394198525392453636",
    },
    async () => {
      const result = authworksConfigGet()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.scopes).toContain("urn:zitadel:iam:org:project:id:394198525392453636:roles")
      }
    },
  )
})

test("authworksConfigGet rejects invalid Authworks settings without leaking secrets", async () => {
  await withEnvironment(
    {
      AUTHWORKS_ISSUER: undefined,
      AUTHWORKS_CLIENT_ID: "authworks-client-id",
      AUTHWORKS_CLIENT_SECRET: "authworks-client-secret",
      AUTHWORKS_SCOPE: undefined,
      AUTHWORKS_REDIRECT_URI: undefined,
      AUTHWORKS_ORGANIZATION_ID: undefined,
      ZITADEL_PROJECT_ID: undefined,
    },
    async () => {
      const result = authworksConfigGet()

      expect(result.success).toBe(false)
      if (!result.success) expect(result.errorMessage).not.toContain("authworks-client-secret")
    },
  )

  await withEnvironment(
    {
      AUTHWORKS_ISSUER: "http://authworks.example.test",
      AUTHWORKS_CLIENT_ID: "authworks-client-id",
      AUTHWORKS_CLIENT_SECRET: undefined,
      AUTHWORKS_SCOPE: undefined,
      AUTHWORKS_REDIRECT_URI: undefined,
      AUTHWORKS_ORGANIZATION_ID: undefined,
      ZITADEL_PROJECT_ID: undefined,
    },
    async () => {
      expect(authworksConfigGet().success).toBe(false)
    },
  )

  await withEnvironment(
    {
      AUTHWORKS_ISSUER: "https://authworks.example.test",
      AUTHWORKS_CLIENT_ID: "authworks-client-id",
      AUTHWORKS_CLIENT_SECRET: undefined,
      AUTHWORKS_SCOPE: "profile email",
      AUTHWORKS_REDIRECT_URI: undefined,
      AUTHWORKS_ORGANIZATION_ID: undefined,
      ZITADEL_PROJECT_ID: undefined,
    },
    async () => {
      expect(authworksConfigGet().success).toBe(false)
    },
  )

  await withEnvironment(
    {
      AUTHWORKS_ISSUER: "https://authworks.example.test",
      AUTHWORKS_CLIENT_ID: "authworks-client-id",
      AUTHWORKS_CLIENT_SECRET: undefined,
      AUTHWORKS_SCOPE: undefined,
      AUTHWORKS_REDIRECT_URI: undefined,
      AUTHWORKS_ORGANIZATION_ID: "380716752838852623",
      ZITADEL_PROJECT_ID: undefined,
    },
    async () => {
      expect(authworksConfigGet().success).toBe(false)
    },
  )
})

test("authworksConfigGet validates the independent admission organization setting", async () => {
  const environment = {
    AUTHWORKS_ISSUER: "https://authworks.example.test",
    AUTHWORKS_CLIENT_ID: "authworks-client-id",
    AUTHWORKS_SCOPE: undefined,
    AUTHWORKS_ORGANIZATION_ID: undefined,
    ZITADEL_PROJECT_ID: undefined,
  }
  const orgId = "01a03273-0662-7b18-9b48-3a7ab29f0bfd"
  await withEnvironment({ ...environment, AUTHWORKS_ADMISSION_ORGANIZATION_ID: orgId.toUpperCase() }, async () => {
    const result = authworksConfigGet()
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.admissionOrgId).toBe(orgId)
    expect(result.data.authworksOrgId).toBeUndefined()
    expect(result.data.scopes).toEqual(["openid", "profile", "email", "urn:zitadel:iam:user:resourceowner"])
  })
  await withEnvironment({ ...environment, AUTHWORKS_ADMISSION_ORGANIZATION_ID: "not-a-uuid" }, async () => {
    const result = authworksConfigGet()
    expect(result.success).toBe(false)
    if (!result.success) expect(result.errorMessage).toBe("invalid AUTHWORKS_ADMISSION_ORGANIZATION_ID")
  })
})

async function withEnvironment(
  values: Record<string, string | undefined>,
  callback: () => Promise<void>,
): Promise<void> {
  const names = [
    "AUTHWORKS_ISSUER",
    "AUTHWORKS_CLIENT_ID",
    "AUTHWORKS_CLIENT_SECRET",
    "AUTHWORKS_SCOPE",
    "AUTHWORKS_REDIRECT_URI",
    "AUTHWORKS_ORGANIZATION_ID",
    "AUTHWORKS_ADMISSION_ORGANIZATION_ID",
    "ZITADEL_PROJECT_ID",
  ]
  const previous = new Map(names.map((name) => [name, process.env[name]]))
  delete process.env.AUTHWORKS_ADMISSION_ORGANIZATION_ID
  for (const [name, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[name]
    else process.env[name] = value
  }
  try {
    await callback()
  } finally {
    for (const [name, value] of previous) {
      if (value === undefined) delete process.env[name]
      else process.env[name] = value
    }
  }
}
